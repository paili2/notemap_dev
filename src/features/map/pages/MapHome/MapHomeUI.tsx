"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import MapTopBar from "@/features/map/components/top/MapTopBar/MapTopBar";
import { FilterSearch } from "../../FilterSearch";
import { MapMenuKey } from "../../components/MapMenu";
import { useRoadview } from "../../hooks/useRoadview";
import { usePinsFromViewport } from "../../hooks/usePinsFromViewport";
import { useSidebar as useSidebarCtx, Sidebar } from "@/features/sidebar";

import { MapViewHandle } from "../../components/MapView/MapView";
import { MapHomeUIProps } from "../components/types";
import { useMergedMarkers } from "./hooks/useMergedMarkers";
import MapCanvas from "./components/MapCanvas";
import ContextMenuHost from "./components/ContextMenuHost";
import TopRightControls from "./components/TopRightControls";
import FilterFab from "./components/FilterFab";
import ModalsHost from "./components/ModalsHost";
import { usePlannedDrafts } from "./hooks/usePlannedDrafts";
import { useBounds } from "./hooks/useBounds";

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

  // ===== 서버 핀 로딩 =====
  const {
    points: serverPoints,
    drafts: serverDrafts,
    loading: pinsLoading,
    error: pinsError,
  } = usePinsFromViewport({ map: mapInstance, debounceMs: 300 });

  // ===== 마커 병합 =====
  const { mergedMarkers, mergedWithTempDraft } = useMergedMarkers({
    localMarkers: markers,
    serverPoints,
    serverDrafts,
    menuOpen,
    menuAnchor,
  });

  // ===== planned only =====
  const {
    plannedDrafts,
    plannedMarkersOnly,
    reloadPlanned,
    state: plannedState,
  } = usePlannedDrafts({ filter, getBounds: useBounds(kakaoSDK, mapInstance) });

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

  // ===== MapView 초기화 (level 고정 후 fit) =====
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

  // ===== 우상단 컨트롤 확장 상태 =====
  const [rightOpen, setRightOpen] = useState(false);
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);
  const [isDistrictOn, setIsDistrictOn] = useState(false);

  return (
    <div className="fixed inset-0">
      {/* 지도/오버레이 묶음 */}
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
        siteReservations={useSidebarCtx().siteReservations}
        onCloseMenu={onCloseMenu}
        onViewFromMenu={onViewFromMenu}
        onCreateFromMenu={onCreateFromMenu}
        onPlanFromMenu={onPlanFromMenu}
        onReserveFromMenu={props.onReserveFromMenu}
        onAddFav={onAddFav}
        onOpenMenu={onOpenMenu}
        onChangeHideLabelForId={onChangeHideLabelForId}
      />

      {/* 상단 검색바 */}
      <MapTopBar
        value={q}
        onChangeSearch={onChangeQ}
        onSubmitSearch={(text) => {
          const query = text.trim();
          if (!query) return;
          onSubmitSearch?.(query);
        }}
      />

      {/* 우상단: MapMenu + ToggleSidebar */}
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
          if (expanded && props.useSidebar) props.setUseSidebar(false);
        }}
        sidebarOpen={props.useSidebar}
        setSidebarOpen={(open) => {
          props.setUseSidebar(open);
          if (open) setRightOpen(false);
        }}
      />

      {/* 좌하단 필터버튼 */}
      <FilterFab onOpen={() => setFilterSearchOpen(true)} />

      {/* 사이드바 & 필터모달 & 상세/생성/로드뷰 모달 */}
      <Sidebar
        isSidebarOn={props.useSidebar}
        onToggleSidebar={() => props.setUseSidebar(!props.useSidebar)}
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
        roadviewContainerRef={
          useRoadview({ kakaoSDK, map: mapInstance }).roadviewContainerRef
        }
        onCloseRoadview={close}
      />
    </div>
  );
}

export default MapHomeUI;
