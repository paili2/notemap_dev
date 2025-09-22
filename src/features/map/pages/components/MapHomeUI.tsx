"use client";

import { useEffect, useState } from "react";

import MapTopBar from "@/features/map/components/top/MapTopBar/MapTopBar";
import ToggleSidebar from "@/features/map/components/top/ToggleSidebar/ToggleSidebar";
import MapMenu from "@/features/map/components/MapMenu/MapMenu";
import { Sidebar } from "@/features/sidebar";

import PropertyViewModal from "@/features/properties/components/PropertyViewModal/PropertyViewModal";

import MapView from "../../components/MapView/MapView";
import { DEFAULT_CENTER, DEFAULT_LEVEL } from "../../lib/constants";
import { FilterSearch } from "../../FilterSearch";
import MapCreateModalHost from "../../components/MapCreateModalHost";
// ⛔ 삭제: import MapEditModalHost from "../../components/MapEditModalHost";
import PinContextMenu from "@/features/map/components/PinContextMenu/PinContextMenu";
import { MapHomeUIProps } from "./types";
import type { PoiKind } from "@/features/map/lib/poiCategory";

export function MapHomeUI(props: MapHomeUIProps) {
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
    onToggleFav,
    favById = {},
  } = props;

  const isVisitId = (id: string) => String(id).startsWith("__visit__");

  // ▼ 주변시설 토글 상태 (외부제어형으로 MapMenu/MapView에 전달)
  const [poiKinds, setPoiKinds] = useState<PoiKind[]>([]); // 기본 비활성

  // UI 전용
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);
  const [isDistrictOn, setIsDistrictOn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
          appKey={appKey}
          center={DEFAULT_CENTER}
          level={DEFAULT_LEVEL}
          markers={markers}
          fitToMarkers={fitAllOnce}
          useDistrict={isDistrictOn}
          onMarkerClick={(id) => {
            const m = markers.find((x) => String(x.id) === String(id));
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
          /** ▼ 주변시설: 외부 제어형 상태 전달 */
          poiKinds={poiKinds}
          showPoiToolbar={false} // 내부 툴바 비활성(메뉴 한 곳에서만 제어)
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

            const pin = menuTargetId
              ? {
                  kind: isVisit ? "plan" : (targetPin as any)?.kind ?? "1room",
                  isFav: computedIsFav,
                }
              : { kind: "plan", isFav: false };

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
                onPlan={onPlanFromMenu}
                onToggleFav={(next) =>
                  onToggleFav?.(next, {
                    id: menuTargetId ?? undefined,
                    pos: menuAnchor ?? undefined,
                  })
                }
                zIndex={10000}
              />
            );
          })()}
      </div>

      {/* 상단 바 */}
      <MapTopBar
        value={q}
        onChangeSearch={onChangeQ}
        onSubmitSearch={(v) => v.trim() && onSubmitSearch(v)}
      />

      {/* 맵 메뉴 (주변시설 토글 전달) */}
      <div className="fixed top-3 right-16 z-[60]">
        <MapMenu
          active={filter as any}
          onChange={onChangeFilter as any}
          isDistrictOn={isDistrictOn}
          onToggleDistrict={setIsDistrictOn}
          /** ▼ 추가: 주변시설 제어형 props (버스/버스정류장은 기본지도에 있으므로 제외) */
          poiKinds={poiKinds}
          onChangePoiKinds={(next) => {
            const filtered = next.filter((k) => k !== "busstop");
            setPoiKinds(filtered);
            // (선택) 사용자 안내가 필요하면 토스트/알림: "버스정류장은 기본지도에 표시됩니다."
          }}
        />
      </div>

      {/* 사이드바 */}
      <ToggleSidebar controlledOpen={useSidebar} onChangeOpen={setUseSidebar} />
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

      {/* 상세 보기 모달 */}
      {viewOpen && selectedViewItem && (
        <PropertyViewModal
          open={true}
          onClose={closeView}
          data={selectedViewItem}
          onSave={onSaveViewPatch}
          onDelete={onDeleteFromView}
          // ⛔ 외부 수정모달 트리거 제거
          // onEdit={onEditFromView}
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

      {/* ⛔ 외부 수정 모달 제거
      {editOpen && selectedViewItem && selectedId && (
        <MapEditModalHost
          open={true}
          data={selectedViewItem}
          selectedId={selectedId}
          onClose={editHostHandlers.onClose}
          updateItems={editHostHandlers.updateItems}
          onSubmit={editHostHandlers.onSubmit}
        />
      )} */}
    </div>
  );
}
