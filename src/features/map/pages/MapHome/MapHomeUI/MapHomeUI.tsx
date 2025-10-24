"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FilterSearch } from "../../../FilterSearch";
import { MapMenuKey } from "../../../components/MapMenu";
import { useRoadview } from "../../../hooks/useRoadview";
import { usePinsFromViewport } from "../../../hooks/usePinsFromViewport";
import { useSidebar as useSidebarCtx, Sidebar } from "@/features/sidebar";
import { MapViewHandle } from "../../../components/MapView/MapView";
import { MapHomeUIProps } from "../../components/types";
import { useMergedMarkers } from "../hooks/useMergedMarkers";
import MapCanvas from "../components/MapCanvas";
import ContextMenuHost from "../components/ContextMenuHost";
import TopRightControls from "../components/TopRightControls";
import FilterFab from "../components/FilterFab";
import ModalsHost from "../components/ModalsHost";
import { usePlannedDrafts } from "../hooks/usePlannedDrafts";
import { useBounds } from "../hooks/useBounds";
import { useBoundsRaw } from "./hooks/useBoundsRaw";
import { cn } from "@/lib/cn";
import SearchForm from "@/features/map/components/top/SearchForm/SearchForm";
import type { MapMarker } from "../../../types/map";
import type { PinKind } from "@/features/pins/types";

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
    createOpen,
    selectedViewItem,
    prefillAddress,
    draftPin,
    selectedPos,
    closeView,
    onSaveViewPatch,
    onDeleteFromView,
    createHostHandlers,
    hideLabelForId,
    onOpenMenu,
    onChangeHideLabelForId,
    onAddFav,
    favById = {},
  } = props;

  const getBoundsLLB = useBounds(kakaoSDK, mapInstance);
  const getBoundsRaw = useBoundsRaw(kakaoSDK, mapInstance);

  /** ✅ 로컬 임시 draft 마커 상태 (신규 등록 직후 즉시 표시용) */
  const [localDraftMarkers, setLocalDraftMarkers] = useState<MapMarker[]>([]);

  /** ✅ 임시 마커 주입/치환/초기화 유틸 */
  const upsertDraftMarker = useCallback(
    (m: {
      id: string | number;
      lat: number;
      lng: number;
      address?: string | null;
      source?: "geocode" | "search" | "draft";
      kind?: PinKind;
    }) => {
      setLocalDraftMarkers((prev) => {
        const list = prev.slice();
        const id = String(m.id);
        const idx = list.findIndex((x) => String(x.id) === id);

        const next: MapMarker = {
          id,
          // ✅ 예약 전 임시핀은 절대 "답사예정" 사용하지 않음
          title: m.address ?? "선택 위치",
          position: { lat: m.lat, lng: m.lng },
          // ✅ source/kind 보존 → 아래 단계에서 isPlan 제외 로직에 필요
          ...(m.source ? ({ source: m.source } as any) : {}),
          kind: (m.kind ?? "question") as PinKind,
        };

        if (idx >= 0) list[idx] = { ...list[idx], ...next };
        else list.push(next);
        return list;
      });
    },
    []
  );

  const replaceTempByRealId = useCallback(
    (tempId: string | number, realId: string | number) => {
      setLocalDraftMarkers((prev) =>
        prev.map((x) =>
          String(x.id) === String(tempId)
            ? { ...x, id: `__visit__${realId}` }
            : x
        )
      );
    },
    []
  );

  const clearLocalDrafts = useCallback(() => setLocalDraftMarkers([]), []);

  // ✅ 필터 → draftState 매핑
  const draftStateForQuery = useMemo<
    undefined | "before" | "scheduled" | "all"
  >(() => {
    switch (filter as MapMenuKey) {
      case "plannedOnly":
        return "before";
      default:
        return undefined;
    }
  }, [filter]);

  // ===== 서버 핀 로딩 =====
  const {
    points: serverPoints,
    drafts: serverDrafts,
    loading: pinsLoading,
    error: pinsError,
  } = usePinsFromViewport({
    map: mapInstance,
    debounceMs: 300,
    draftState: draftStateForQuery,
  });

  // title의 null → undefined 정규화
  const normServerPoints = useMemo(
    () => serverPoints?.map((p) => ({ ...p, title: p.title ?? undefined })),
    [serverPoints]
  );
  const normServerDrafts = useMemo(
    () => serverDrafts?.map((d) => ({ ...d, title: d.title ?? undefined })),
    [serverDrafts]
  );

  // ===== 마커 병합 =====
  const { mergedMarkers, mergedWithTempDraft, mergedMeta } = useMergedMarkers({
    /** ⬅️ 기존 props.markers + 로컬 임시 마커 함께 전달 */
    localMarkers: useMemo(
      () => [...(markers ?? []), ...localDraftMarkers],
      [markers, localDraftMarkers]
    ),
    serverPoints: normServerPoints,
    serverDrafts: normServerDrafts,
    menuOpen,
    menuAnchor,
  });

  // ===== planned only =====
  const { plannedDrafts, plannedMarkersOnly } = usePlannedDrafts({
    filter,
    getBounds: getBoundsRaw,
  });

  // ===== roadview =====
  const {
    roadviewContainerRef,
    visible: roadviewVisible,
    openAtCenter,
    close,
  } = useRoadview({ kakaoSDK, map: mapInstance, autoSync: true });

  const toggleRoadview = useCallback(() => {
    roadviewVisible ? close() : openAtCenter();
  }, [roadviewVisible, close, openAtCenter]);

  // ===== MapView 초기화 =====
  const mapViewRef = useRef<MapViewHandle>(null);
  const [didInit, setDidInit] = useState(false);
  const handleMapReady = useCallback(
    (api: unknown) => {
      onMapReady?.(api);
      requestAnimationFrame(() => setDidInit(true));
    },
    [onMapReady]
  );

  // ===== 보이는 마커 결정 =====
  const activeMenu = (filter as MapMenuKey) ?? "all";
  const visibleMarkers = useMemo(() => {
    if (activeMenu === "plannedOnly") return plannedMarkersOnly;
    return mergedWithTempDraft;
  }, [activeMenu, plannedMarkersOnly, mergedWithTempDraft]);

  // ===== 우상단 컨트롤 상태 =====
  const [rightOpen, setRightOpen] = useState(false);
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);
  const [isDistrictOn, setIsDistrictOn] = useState(false);

  // 사이드바 컨텍스트
  const { siteReservations } = useSidebarCtx();

  // ✅ 뷰포트 핀 재패치 트리거 (훅이 idle 이벤트를 듣는 경우를 고려해 안전한 no-op 움직임)
  const refreshViewportPins = useCallback(
    async (_box?: {
      sw: { lat: number; lng: number };
      ne: { lat: number; lng: number };
    }) => {
      if (!kakaoSDK || !mapInstance) return;
      try {
        const c = mapInstance.getCenter();
        // 같은 센터로 setCenter가 idle을 안 쏘면, level 토글로 강제 발생
        const level = mapInstance.getLevel();
        mapInstance.setLevel(level + 1, { animate: false });
        mapInstance.setLevel(level, { animate: false });
        mapInstance.setCenter(c);
      } catch {}
    },
    [kakaoSDK, mapInstance]
  );

  // 🔎 주소/키워드 검색 → 지도 이동만 (idle은 훅이 듣는다)
  const handleSubmitSearch = useCallback(
    (text: string) => {
      const query = text.trim();
      if (!query || !kakaoSDK || !mapInstance) return;

      onSubmitSearch?.(query);

      const geocoder = new kakaoSDK.maps.services.Geocoder();
      geocoder.addressSearch(query, (res: any[], status: string) => {
        if (status !== kakaoSDK.maps.services.Status.OK || !res?.[0]) return;
        const { x, y } = res[0]; // x: lng, y: lat
        const target = new kakaoSDK.maps.LatLng(+y, +x);
        mapInstance.setCenter(target); // idle 자동 발생 → usePinsFromViewport가 처리
      });
    },
    [kakaoSDK, mapInstance, onSubmitSearch]
  );

  return (
    <div className="fixed inset-0">
      <MapCanvas
        appKey={appKey}
        kakaoSDK={kakaoSDK}
        mapInstance={mapInstance}
        markers={visibleMarkers}
        fitAllOnce={didInit ? fitAllOnce : undefined}
        poiKinds={poiKinds}
        pinsLoading={pinsLoading}
        pinsError={pinsError}
        menuOpen={menuOpen}
        menuAnchor={menuAnchor}
        hideLabelForId={hideLabelForId}
        onMarkerClick={onMarkerClick}
        onOpenMenu={onOpenMenu}
        onChangeHideLabelForId={onChangeHideLabelForId}
        onMapReady={handleMapReady}
        onViewportChange={onViewportChange}
        isDistrictOn={isDistrictOn}
      />

      <ContextMenuHost
        open={menuOpen}
        kakaoSDK={kakaoSDK}
        mapInstance={mapInstance}
        menuAnchor={menuAnchor}
        menuTargetId={menuTargetId}
        menuTitle={menuTitle}
        menuRoadAddr={menuRoadAddr}
        menuJibunAddr={menuJibunAddr}
        visibleMarkers={visibleMarkers}
        mergedMeta={mergedMeta}
        favById={favById}
        siteReservations={siteReservations}
        onCloseMenu={onCloseMenu}
        onViewFromMenu={onViewFromMenu}
        onCreateFromMenu={onCreateFromMenu}
        onPlanFromMenu={onPlanFromMenu}
        onReserveFromMenu={props.onReserveFromMenu}
        onAddFav={onAddFav}
        onOpenMenu={onOpenMenu}
        onChangeHideLabelForId={onChangeHideLabelForId}
        /** ✅ 등록 직후 즉시 지도에 꽂을 임시 마커 주입
         *    - source/kind를 그대로 보존해서 isPlan 제외 로직이 정확히 동작하도록
         */
        upsertDraftMarker={(m) =>
          upsertDraftMarker({
            id: m.id,
            lat: m.lat,
            lng: m.lng,
            address: m.address ?? null,
            // ⬇⬇⬇ 그대로 전달
            source: (m as any).source,
            kind: (m as any).kind as PinKind | undefined,
          })
        }
        /** ✅ 가능한 경우 뷰포트 재패치 */
        refreshViewportPins={refreshViewportPins}
      />

      {/* 상단 검색바 */}
      <div
        className={cn(
          "flex flex-wrap md:flex-nowrap",
          "pointer-events-none absolute left-3 top-3 z-[70] items-center gap-2"
        )}
        role="region"
        aria-label="지도 상단 검색"
      >
        <div className="pointer-events-auto">
          <SearchForm
            value={q}
            onChange={onChangeQ}
            onSubmit={handleSubmitSearch}
            placeholder="장소, 주소, 버스 검색"
            className="flex-1 min-w-[200px] md:min-w-[260px] max-w-[420px]"
          />
        </div>
      </div>

      <TopRightControls
        activeMenu={activeMenu}
        onChangeFilter={(next) => {
          const resolved = next === activeMenu ? "all" : next;
          (onChangeFilter as any)(resolved);
        }}
        isDistrictOn={isDistrictOn}
        setIsDistrictOn={setIsDistrictOn}
        poiKinds={poiKinds}
        onChangePoiKinds={onChangePoiKinds}
        roadviewVisible={roadviewVisible}
        onToggleRoadview={toggleRoadview}
        rightOpen={rightOpen}
        setRightOpen={(expanded) => {
          setRightOpen(expanded);
          if (expanded && useSidebar) setUseSidebar(false);
        }}
        sidebarOpen={useSidebar}
        setSidebarOpen={(open) => {
          setUseSidebar(open);
          if (open) setRightOpen(false);
        }}
        getBounds={getBoundsLLB}
      />

      <FilterFab onOpen={() => setFilterSearchOpen(true)} />
      <Sidebar
        isSidebarOn={useSidebar}
        onToggleSidebar={() => setUseSidebar(!useSidebar)}
      />
      <FilterSearch
        isOpen={filterSearchOpen}
        onClose={() => setFilterSearchOpen(false)}
      />

      <ModalsHost
        viewOpen={viewOpen}
        selectedViewItem={selectedViewItem}
        onCloseView={closeView}
        onSaveViewPatch={onSaveViewPatch}
        onDeleteFromView={onDeleteFromView}
        createOpen={createOpen}
        prefillAddress={prefillAddress}
        draftPin={draftPin}
        selectedPos={selectedPos}
        createHostHandlers={createHostHandlers}
        roadviewVisible={roadviewVisible}
        roadviewContainerRef={roadviewContainerRef}
        onCloseRoadview={close}
      />
    </div>
  );
}

export default MapHomeUI;
