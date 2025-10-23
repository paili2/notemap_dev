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

  const getBoundsLLB = useBounds(kakaoSDK, mapInstance); // kakao.maps.LatLngBounds 반환
  const getBoundsRaw = useBoundsRaw(kakaoSDK, mapInstance); // {swLat, swLng, neLat, neLng} 반환

  // ===== 서버 핀 로딩 =====
  const {
    points: serverPoints,
    drafts: serverDrafts,
    loading: pinsLoading,
    error: pinsError,
  } = usePinsFromViewport({ map: mapInstance, debounceMs: 300 });

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
  const { mergedMarkers, mergedWithTempDraft } = useMergedMarkers({
    localMarkers: markers,
    serverPoints: normServerPoints,
    serverDrafts: normServerDrafts,
    menuOpen,
    menuAnchor,
  });

  // ===== planned only =====
  const {
    plannedDrafts,
    plannedMarkersOnly,
    reloadPlanned,
    state: plannedState,
  } = usePlannedDrafts({ filter, getBounds: getBoundsRaw });

  // ===== roadview =====
  const {
    roadviewContainerRef,
    visible: roadviewVisible,
    openAtCenter,
    openAt,
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

  return (
    <div className="fixed inset-0">
      {/* 지도/오버레이 */}
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

      {/* 컨텍스트 메뉴 */}
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
      />

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
            onSubmit={(text) => {
              const query = text.trim();
              if (!query) return;
              onSubmitSearch?.(query);
            }} // 지오코딩 → setCenter → idle/요청
            placeholder="장소, 주소, 버스 검색"
            className="flex-1 min-w-[200px] md:min-w-[260px] max-w-[420px]"
          />
        </div>
      </div>

      {/* 우상단 컨트롤 */}
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

      {/* 좌하단 필터 버튼 */}
      <FilterFab onOpen={() => setFilterSearchOpen(true)} />

      {/* 사이드바 & 필터 모달 */}
      <Sidebar
        isSidebarOn={useSidebar}
        onToggleSidebar={() => setUseSidebar(!useSidebar)}
      />
      <FilterSearch
        isOpen={filterSearchOpen}
        onClose={() => setFilterSearchOpen(false)}
      />

      {/* 모달 호스트 */}
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
