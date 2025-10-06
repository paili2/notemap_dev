"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import MapTopBar from "@/features/map/components/top/MapTopBar/MapTopBar";
import ToggleSidebar from "@/features/map/components/top/ToggleSidebar/ToggleSidebar";
import MapMenu from "@/features/map/components/MapMenu/MapMenu";
import { Sidebar } from "@/features/sidebar";
import { useSidebar as useSidebarCtx } from "@/features/sidebar";

import PropertyViewModal from "@/features/properties/components/PropertyViewModal/PropertyViewModal";

import MapView, { MapViewHandle } from "../../components/MapView/MapView";
import { DEFAULT_CENTER, DEFAULT_LEVEL } from "../../lib/constants";
import { FilterSearch } from "../../FilterSearch";
import MapCreateModalHost from "../../components/MapCreateModalHost";
import PinContextMenu from "@/features/map/components/PinContextMenu/PinContextMenu";
import { MapHomeUIProps } from "./types";
import { useRoadview } from "../../hooks/useRoadview";
import RoadviewHost from "../../components/Roadview/RoadviewHost";
import { MapMenuKey } from "../../components/MapMenu";

export function MapHomeUI(props: MapHomeUIProps) {
  const [rightOpen, setRightOpen] = useState(false);
  const {
    appKey,
    kakaoSDK,
    mapInstance,
    markers,
    fitAllOnce,

    q,
    filter,
    onChangeQ,
    onChangeFilter,
    onSubmitSearch,

    useSidebar,
    setUseSidebar,

    poiKinds,
    onChangePoiKinds,

    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    menuTitle,
    onCloseMenu,
    onViewFromMenu,
    onCreateFromMenu,
    onPlanFromMenu,

    onMarkerClick,
    onMapReady,
    onViewportChange,

    addFav,

    viewOpen,
    // ⛔ 외부 수정 모달 관련 값은 더 이상 쓰지 않지만 타입 유지 위해 언더스코어로 받기
    editOpen: _editOpen,
    selectedId: _selectedId,

    createOpen,
    selectedViewItem,
    prefillAddress,
    draftPin,
    selectedPos,
    closeView,
    onSaveViewPatch,
    // ⛔ ViewModal 내부에서 자체적으로 edit 전환하므로 불필요
    onEditFromView: _onEditFromView,
    onDeleteFromView,
    createHostHandlers,
    // ⛔ 외부 수정 모달 핸들러 불필요
    editHostHandlers: _editHostHandlers,

    hideLabelForId,
    onOpenMenu,
    onChangeHideLabelForId,

    // ✅ 즐겨찾기
    onAddFav,
    favById = {},
  } = props;

  const isVisitId = (id: string) => String(id).startsWith("__visit__");

  // 좌표→보정키 (소수점 5자리 반올림 예시)
  const getPosKey = (
    p?: { lat: number; lng: number } | null
  ): string | undefined => {
    if (!p || typeof p.lat !== "number" || typeof p.lng !== "number")
      return undefined; // null 대신 undefined 반환
    const lat = Number(p.lat).toFixed(5);
    const lng = Number(p.lng).toFixed(5);
    return `${lat},${lng}`;
  };

  const { handleAddSiteReservation, siteReservations, setPendingReservation } =
    useSidebarCtx();

  // 예약(답사지예약) 등록 여부를 폭넓게 감지
  const isReserved = (m: any) => {
    if (!m || typeof m !== "object") return false;

    // 1) 대표 케이스
    if (m?.visit?.reserved === true) return true;
    if (m?.visit?.reservation) return true;
    if (m?.reservationId) return true;
    if (m?.reservation) return true;

    // 2) 배열/카운트 형태
    if (
      Array.isArray(m?.visit?.reservations) &&
      m.visit.reservations.length > 0
    )
      return true;
    if (Array.isArray(m?.reservations) && m.reservations.length > 0)
      return true;

    // 3) 상태(enum/string) 형태
    const statusCandidates = [
      m?.visit?.status,
      m?.visit?.state,
      m?.status,
      m?.state,
    ];
    if (
      statusCandidates.some(
        (s) =>
          typeof s === "string" &&
          ["reserved", "booked", "scheduled", "confirmed"].includes(
            s.toLowerCase()
          )
      )
    )
      return true;

    // 4) 이름 규칙 스캔: reservation*, reserved*, booking*, schedule*
    const scanObj = (obj: any): boolean => {
      if (!obj || typeof obj !== "object") return false;
      for (const [k, v] of Object.entries(obj)) {
        const key = k.toLowerCase();
        if (/(reserv|booking|schedule)/.test(key)) {
          // truthy면 예약이 있는 걸로 간주 (불리언 true, 문자열/날짜, 객체/배열 등)
          if (v) return true;
          if (typeof v === "number" && v > 0) return true; // count 같은 숫자
        }
        if (v && typeof v === "object") {
          if (scanObj(v)) return true;
        }
      }
      return false;
    };

    // visit 우선 스캔 → 루트 스캔
    if (scanObj(m?.visit)) return true;
    if (scanObj(m)) return true;

    return false;
  };

  // 현재 선택된 필터 키
  const activeMenu = (filter as MapMenuKey) ?? "all";

  // 사이드바 예약 목록의 id 집합
  const reservedIdSet = useMemo(() => {
    const list = Array.isArray(siteReservations) ? siteReservations : [];
    return new Set(list.map((it: any) => String(it.id)));
  }, [siteReservations]);

  // 좌표 보정키(posKey) 집합 (id가 바뀌어도 좌표로 매칭)
  const reservedPosSet = useMemo(() => {
    const list = Array.isArray(siteReservations) ? siteReservations : [];
    const s = new Set<string>();
    list.forEach((it: any) => {
      if (typeof it?.posKey === "string" && it.posKey) s.add(it.posKey);
    });
    return s;
  }, [siteReservations]);

  const visibleMarkers = useMemo(() => {
    if (activeMenu !== "plannedOnly") return markers;

    return markers.filter((m: any) => {
      const plannedLike =
        (typeof m?.id !== "undefined" && isVisitId(String(m.id))) ||
        m?.visit?.planned === true;

      const reservedById =
        typeof m?.id !== "undefined" && reservedIdSet.has(String(m.id));

      const posKey = m?.position ? getPosKey(m.position) : null;
      const reservedByPos = !!(posKey && reservedPosSet.has(posKey));

      return plannedLike && !reservedById && !reservedByPos && !isReserved(m);
    });
  }, [markers, activeMenu, reservedIdSet, reservedPosSet]);

  // 로드뷰 표시 상태 (메뉴에 전달)
  const {
    roadviewContainerRef,
    visible: roadviewVisible,
    loading: roadviewLoading,
    openAtCenter,
    openAt,
    close,
  } = useRoadview({
    kakaoSDK,
    map: mapInstance,
    autoSync: true,
  });

  const mapViewRef = useRef<MapViewHandle>(null);

  // 최초 1회만 level=4 고정 후, 그 다음부터 fitToMarkers 허용
  const [didInit, setDidInit] = useState(false);

  const handleMapReady = useCallback(
    (api: unknown) => {
      // 원래 콜백 먼저
      onMapReady?.(api);

      // 초기 한 프레임 동안 fitToMarkers를 비활성화했으므로
      // level={DEFAULT_LEVEL} 그대로 초기 렌더에 적용됨
      requestAnimationFrame(() => {
        setDidInit(true);
      });
    },
    [onMapReady]
  );

  const toggleRoadview = useCallback(() => {
    roadviewVisible ? close() : openAtCenter();
  }, [roadviewVisible, close, openAtCenter]);

  // UI 전용
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);
  const [isDistrictOn, setIsDistrictOn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleAddFav = useCallback(() => {
    if (onAddFav) void onAddFav(); // Promise여도 void로 처리 → () => void 타입 만족
  }, [onAddFav]);

  useEffect(() => {
    if (menuOpen && menuAnchor && kakaoSDK && mapInstance) {
      const ids: number[] = [];
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => setShowMenu(true));
        ids.push(id2);
      });
      ids.push(id1);
      return () => {
        ids.forEach((n) => cancelAnimationFrame(n));
        setShowMenu(false);
      };
    } else {
      setShowMenu(false);
    }
  }, [menuOpen, menuAnchor, kakaoSDK, mapInstance]);

  return (
    <div className="fixed inset-0">
      {/* 지도 */}
      <div className="absolute inset-0">
        <MapView
          ref={mapViewRef}
          appKey={appKey}
          center={DEFAULT_CENTER}
          level={DEFAULT_LEVEL}
          markers={visibleMarkers}
          fitToMarkers={didInit ? fitAllOnce : undefined}
          useDistrict={isDistrictOn}
          onMarkerClick={(id) => {
            const m = visibleMarkers.find((x) => String(x.id) === String(id));
            if (!m) return;

            if (isVisitId(String(id))) {
              const key = String(m.id);
              onOpenMenu({
                position: m.position,
                propertyId: key,
                propertyTitle: m.title ?? "답사예정",
                pin: {
                  kind: "plan",
                  isFav: Boolean(
                    key in favById ? favById[key] : (m as any)?.isFav
                  ),
                },
              });
              onChangeHideLabelForId?.(key);
              return;
            }

            onMarkerClick?.(String(id));
          }}
          onMapReady={onMapReady}
          onViewportChange={onViewportChange}
          allowCreateOnMapClick={false}
          hideLabelForId={hideLabelForId}
          onDraftPinClick={(pos) => {
            onOpenMenu({
              position: pos,
              propertyId: "__draft__",
              propertyTitle: "선택 위치",
              pin: { kind: "plan", isFav: false },
            });
            onChangeHideLabelForId?.("__draft__");
          }}
          poiKinds={poiKinds}
          showPoiToolbar={false}
        />

        {mapInstance &&
          kakaoSDK &&
          menuAnchor &&
          showMenu &&
          (() => {
            const targetPin = menuTargetId
              ? markers.find((m) => String(m.id) === String(menuTargetId))
              : undefined;

            const isVisit =
              !!menuTargetId && String(menuTargetId).startsWith("__visit__");

            const hasFav =
              !!menuTargetId &&
              Object.prototype.hasOwnProperty.call(favById, menuTargetId);

            const computedIsFav = Boolean(
              hasFav ? favById[menuTargetId!] : (targetPin as any)?.isFav
            );

            const pin =
              menuTargetId && targetPin
                ? {
                    id: String(targetPin.id),
                    title: targetPin.title ?? "이름 없음",
                    position: targetPin.position,
                    kind: isVisit
                      ? "plan"
                      : (targetPin as any)?.kind ?? "1room",
                    isFav: computedIsFav,
                  }
                : {
                    id: "__draft__",
                    title: "선택 위치",
                    position: menuAnchor,
                    kind: "plan",
                    isFav: false,
                  };

            return (
              <PinContextMenu
                key={
                  menuTargetId
                    ? `bubble-${menuTargetId}`
                    : `bubble-draft-${menuAnchor.lat},${menuAnchor.lng}`
                }
                kakao={kakaoSDK}
                map={mapInstance}
                position={
                  new kakaoSDK.maps.LatLng(menuAnchor.lat, menuAnchor.lng)
                }
                roadAddress={menuRoadAddr ?? undefined}
                jibunAddress={menuJibunAddr ?? undefined}
                propertyId={menuTargetId ?? "__draft__"}
                propertyTitle={menuTitle ?? undefined}
                pin={pin}
                onClose={onCloseMenu}
                onView={onViewFromMenu}
                onCreate={onCreateFromMenu}
                onPlan={(payload) => {
                  // payload: { lat, lng, address, roadAddress?, jibunAddress?, propertyId?, propertyTitle?, dateISO? }
                  const {
                    lat,
                    lng,
                    address,
                    roadAddress,
                    jibunAddress,
                    propertyId,
                    propertyTitle,
                    dateISO,
                  } = payload || {};

                  // 최종 값 정리
                  const finalLat = lat ?? menuAnchor.lat;
                  const finalLng = lng ?? menuAnchor.lng;
                  const finalTitle = String(
                    address ??
                      menuTitle ??
                      menuRoadAddr ??
                      menuJibunAddr ??
                      pin.title ??
                      "답사예정"
                  );
                  const finalId =
                    (propertyId ??
                      (menuTargetId && menuTargetId !== "__draft__"
                        ? String(menuTargetId)
                        : undefined)) ||
                    crypto.randomUUID();
                  const finalDateISO =
                    dateISO ?? new Date().toISOString().slice(0, 10);

                  // ✅ 사이드바 "답사지예약"에 즉시 추가 (주소 + 날짜 + posKey)
                  handleAddSiteReservation({
                    id: finalId,
                    title: finalTitle,
                    dateISO: finalDateISO,
                    posKey: getPosKey({ lat: finalLat, lng: finalLng }),
                  });

                  // 🔒 하나만 열리도록
                  setRightOpen(false);
                  setUseSidebar(true);
                  onCloseMenu?.();

                  // 기존 콜백 유지(필요 시)
                  onPlanFromMenu?.({ lat: finalLat, lng: finalLng });
                }}
                onAddFav={handleAddFav}
                zIndex={10000}
              />
            );
          })()}
      </div>

      <MapTopBar
        value={q}
        onChangeSearch={onChangeQ}
        onSubmitSearch={(text) => {
          const query = text.trim();
          if (!query) return;
          const preferStation = /역|출구/.test(query);
          mapViewRef.current?.searchPlace(query, {
            fitZoom: true,
            recenter: true,
            preferStation,
            onFound: (pos) => openAt(pos, { face: pos }),
          });
        }}
      />

      {/* MapMenu토글버튼 + 모달 (주변시설·로드뷰) */}
      <div className="fixed top-3 right-3 z-[20000] pointer-events-none">
        <div
          className="relative flex items-center gap-2 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative z-[20002] shrink-0">
            <MapMenu
              active={activeMenu}
              onChange={(next) => {
                const resolved = next === activeMenu ? "all" : next;
                (onChangeFilter as any)(resolved);
              }}
              isDistrictOn={isDistrictOn}
              onToggleDistrict={setIsDistrictOn}
              poiKinds={poiKinds}
              onChangePoiKinds={onChangePoiKinds}
              roadviewVisible={roadviewVisible}
              onToggleRoadview={toggleRoadview}
              expanded={rightOpen}
              onExpandChange={(expanded) => {
                setRightOpen(expanded);
                if (expanded && useSidebar) setUseSidebar(false);
              }}
            />
          </div>

          {/* (오른쪽) 계약관리/답사지예약 토글 버튼 */}
          <div className="relative z-[20003] shrink-0">
            <ToggleSidebar
              overlay={false} // 버튼만 렌더
              controlledOpen={useSidebar}
              onChangeOpen={(open) => {
                setUseSidebar(open);
                if (open) setRightOpen(false); // 라디오처럼 하나만
              }}
            />
          </div>
        </div>
      </div>

      {/* 답사, 즐겨찾기 등 모달 */}
      <Sidebar
        isSidebarOn={useSidebar}
        onToggleSidebar={() => setUseSidebar(!useSidebar)}
      />

      {/* 좌측 하단 필터 검색 버튼 */}
      <div className="absolute bottom-4 left-4 z-30">
        <button
          onClick={() => setFilterSearchOpen(true)}
          className="bg-gray-900 shadow-2xl border-2 border-gray-800 hover:bg-gray-800 p-3 rounded-lg transition-all duration-200 hover:scale-105"
          title="필터 검색"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
      </div>

      {/* FilterSearch 모달 */}
      <FilterSearch
        isOpen={filterSearchOpen}
        onClose={() => setFilterSearchOpen(false)}
      />

      {/* 즐겨찾기 모달 (임시) */}
      {addFav && <div>모달</div>}

      {/* 상세 보기 모달 */}
      {viewOpen && selectedViewItem && (
        <PropertyViewModal
          open={true}
          onClose={closeView}
          data={selectedViewItem}
          onSave={onSaveViewPatch}
          onDelete={onDeleteFromView}
        />
      )}

      {/* 신규 등록 모달 */}
      {createOpen && (
        <MapCreateModalHost
          open={createOpen}
          prefillAddress={prefillAddress}
          draftPin={draftPin}
          selectedPos={selectedPos}
          onClose={createHostHandlers.onClose}
          appendItem={createHostHandlers.appendItem}
          selectAndOpenView={createHostHandlers.selectAndOpenView}
          resetAfterCreate={createHostHandlers.resetAfterCreate}
        />
      )}
      <RoadviewHost
        open={roadviewVisible}
        onClose={close}
        onResize={() => {
          // 필요하다면 roadview.resize() 호출
        }}
        containerRef={roadviewContainerRef}
      />
    </div>
  );
}
