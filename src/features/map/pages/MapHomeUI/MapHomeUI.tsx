"use client";

import { useCallback, useMemo, useState } from "react";

import { useSidebar as useSidebarCtx, Sidebar } from "@/features/sidebar";

import { useMergedMarkers } from "../hooks/useMergedMarkers";
import MapCanvas from "../components/MapCanvas";
import ContextMenuHost from "../components/ContextMenuHost";
import FilterFab from "../components/FilterFab";
import ModalsHost from "../components/ModalsHost";

import type { PinKind } from "@/features/pins/types";
import type { ListItem, SubListItem } from "@/features/sidebar/types/sidebar";

import { useRoadview } from "@/features/map/hooks/useRoadview";
import { useBounds } from "@/features/map/hooks/useBounds";
import { MapMenuKey } from "@/features/map/components/menu/components/types";
import { NoResultDialog } from "@/features/map/components/NoResultDialog";
import { MapHomeUIProps } from "../types";
import { useBoundsRaw } from "../../hooks/useBoundsRaw";
import { usePlannedDrafts } from "../../hooks/usePlannedDrafts";
import { FilterSearch } from "../../components/filterSearch";

import { usePlaceSearchOnMap } from "./hooks/usePlaceSearchOnMap";
import { useViewModalState } from "./hooks/useViewModalState";
import { usePanelsAndToggles } from "./hooks/usePanelsAndToggles";

/* 🔎 검색 / 필터 훅들 */
import { useFilterSearch } from "./hooks/useFilterSearch";
import { useViewportPinsForMapHome } from "./hooks/useViewportPinsForMapHome";
import { useAfterCreateHandler } from "./hooks/useAfterCreateHandler";

/* 👀 지도 포커스 유틸 */
import { focusMapToPosition } from "./lib/viewUtils";
import { TopRegion } from "./components/TopRegion";

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
    onCreateFromMenu,
    onPlanFromMenu,
    onMarkerClick,
    onMapReady,
    onViewportChange,
    createOpen,
    createPinKind,
    draftHeaderPrefill,
    selectedViewItem,
    prefillAddress,
    draftPin,
    selectedPos,
    onSaveViewPatch,
    onDeleteFromView,
    createHostHandlers,
    hideLabelForId,
    onOpenMenu,
    onChangeHideLabelForId,
    onAddFav,
    favById = {},
    onReserveFromMenu,
    onViewFromMenu,
    closeView,
    createFromDraftId,
  } = props;

  const getBoundsLLB = useBounds(kakaoSDK, mapInstance);
  const getBoundsRaw = useBoundsRaw(kakaoSDK, mapInstance);

  // 🔭 로드뷰
  const {
    roadviewContainerRef,
    visible: roadviewVisible,
    openAtCenter,
    openAt,
    close,
  } = useRoadview({ kakaoSDK, map: mapInstance, autoSync: true });

  // 🔧 패널 / 토글 묶음 훅
  const {
    isDistrictOn,
    rightOpen,
    filterSearchOpen,
    noResultDialogOpen,
    roadviewRoadOn,
    handleSetDistrictOn,
    handleSetRightOpen,
    setFilterSearchOpen,
    setNoResultDialogOpen,
    handleOpenFilterSearch,
    handleToggleSidebar,
    toggleRoadviewRoad,
    rightAreaRef,
    filterAreaRef,
    sidebarAreaRef,
  } = usePanelsAndToggles({
    useSidebar,
    setUseSidebar,
    roadviewVisible,
    closeRoadview: close,
  });

  // 🔍 필터 검색 상태/로직 (API + bounds 맞추기)
  const {
    searchRes,
    searchLoading,
    searchError,
    handleApplyFilters,
    clearSearch,
  } = useFilterSearch({
    kakaoSDK,
    mapInstance,
    setFilterSearchOpen,
    setNoResultDialogOpen,
  });

  // 🔍 뷰포트 기준 서버 핀 + 검색 결과 머지된 형태
  const {
    pinsLoading,
    pinsError,
    effectiveServerPoints,
    effectiveServerDrafts,
  } = useViewportPinsForMapHome({
    mapInstance,
    filter: filter as MapMenuKey,
    searchRes,
  });

  // 🔍 상단 장소 검색 + 검색핀 관리
  const {
    localDraftMarkers,
    upsertDraftMarker,
    replaceTempByRealId,
    handleSubmitSearch,
    handleViewportChangeInternal,
  } = usePlaceSearchOnMap({
    kakaoSDK,
    mapInstance,
    effectiveServerPoints,
    effectiveServerDrafts,
    onSubmitSearch,
    onViewportChange,
    onOpenMenu,
    onChangeHideLabelForId,
    menuOpen,
    menuAnchor,
    hideLabelForId: hideLabelForId ?? undefined,
  });

  // 서버핀 + 로컬 임시핀 merge
  const { mergedWithTempDraft, mergedMeta } = useMergedMarkers({
    localMarkers: useMemo(
      () => [...(markers ?? []), ...localDraftMarkers],
      [markers, localDraftMarkers]
    ),
    serverPoints: effectiveServerPoints,
    serverDrafts: effectiveServerDrafts,
    menuOpen,
    menuAnchor,
    filterKey: filter,
  });

  // 답사 예정 draft 핀 (오렌지/빨강 토글용)
  usePlannedDrafts({ filter, getBounds: getBoundsRaw });

  const handleRoadviewClickOnMap = useCallback(
    (pos: { lat: number; lng: number }) => {
      openAt(pos, { face: pos });
      if (isDistrictOn) {
        handleSetDistrictOn(false);
      }
    },
    [openAt, isDistrictOn, handleSetDistrictOn]
  );

  const toggleRoadview = useCallback(() => {
    if (roadviewVisible) {
      close();
      return;
    }

    const anchor =
      selectedPos ??
      menuAnchor ??
      draftPin ??
      (mapInstance?.getCenter
        ? {
            lat: mapInstance.getCenter().getLat(),
            lng: mapInstance.getCenter().getLng(),
          }
        : null);

    if (anchor) {
      openAt(anchor, { face: anchor });
    } else {
      openAtCenter();
    }

    if (isDistrictOn) {
      handleSetDistrictOn(false);
    }
  }, [
    roadviewVisible,
    close,
    openAt,
    openAtCenter,
    selectedPos,
    menuAnchor,
    draftPin,
    mapInstance,
    isDistrictOn,
    handleSetDistrictOn,
  ]);

  const [didInit, setDidInit] = useState(false);

  const handleMapReady = useCallback(
    (api: unknown) => {
      onMapReady?.(api);
      requestAnimationFrame(() => setDidInit(true));
    },
    [onMapReady]
  );

  const activeMenu = (filter as MapMenuKey) ?? "all";
  const visibleMarkers = useMemo(
    () => mergedWithTempDraft,
    [mergedWithTempDraft]
  );

  // 🔄 뷰 모달 상태 관리
  const refreshViewportPins = useCallback(async () => {
    if (!kakaoSDK || !mapInstance) return;
    try {
      const c = mapInstance.getCenter();
      const level = mapInstance.getLevel();
      mapInstance.setLevel(level + 1, { animate: false });
      mapInstance.setLevel(level, { animate: false });
      mapInstance.setCenter(c);
    } catch {}
  }, [kakaoSDK, mapInstance]);

  const {
    viewOpenLocal,
    selectedViewForModal,
    handleViewFromMenu,
    handleOpenViewAfterCreate,
    handleDeleteFromView,
    handleCloseView,
  } = useViewModalState({
    selectedViewItem: selectedViewItem ?? null,
    onViewFromMenu,
    onDeleteFromView,
    refreshViewportPins,
    closeView,
  });

  // 생성 후 임시핀/방문핀 처리 (커스텀 훅)
  const { handleAfterCreate } = useAfterCreateHandler({
    createHostHandlers,
    closeView,
    replaceTempByRealId,
    upsertDraftMarker,
  });

  const { siteReservations } = useSidebarCtx();

  // 🔎 사이드바에서 지도 포커싱
  const handleFocusItemMap = useCallback(
    (item: ListItem | null) => {
      if (!item) return;
      const lat = (item as any).lat;
      const lng = (item as any).lng;
      if (lat == null || lng == null) return;

      focusMapToPosition({ kakaoSDK, mapInstance, lat, lng });
    },
    [kakaoSDK, mapInstance]
  );

  const handleFocusSubItemMap = useCallback(
    (sub: SubListItem | null) => {
      if (!sub) return;
      const lat = (sub as any).lat;
      const lng = (sub as any).lng;
      if (lat == null || lng == null) return;

      focusMapToPosition({ kakaoSDK, mapInstance, lat, lng });
    },
    [kakaoSDK, mapInstance]
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
        pinsLoading={pinsLoading || searchLoading}
        pinsError={pinsError || searchError}
        menuOpen={menuOpen}
        menuAnchor={menuAnchor}
        hideLabelForId={hideLabelForId}
        onMarkerClick={onMarkerClick}
        onOpenMenu={onOpenMenu}
        onChangeHideLabelForId={onChangeHideLabelForId}
        onMapReady={handleMapReady}
        onViewportChange={handleViewportChangeInternal}
        isDistrictOn={isDistrictOn}
        showRoadviewOverlay={roadviewRoadOn}
        onRoadviewClick={roadviewRoadOn ? handleRoadviewClickOnMap : undefined}
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
        onViewFromMenu={(id) => handleViewFromMenu(String(id))}
        onCreateFromMenu={onCreateFromMenu}
        onPlanFromMenu={onPlanFromMenu}
        onReserveFromMenu={onReserveFromMenu}
        onAddFav={onAddFav}
        onChangeHideLabelForId={onChangeHideLabelForId}
        upsertDraftMarker={(m) =>
          upsertDraftMarker({
            id: m.id,
            lat: m.lat,
            lng: m.lng,
            address: m.address ?? null,
            source: (m as any).source,
            kind: (m as any).kind as PinKind | undefined,
          })
        }
        refreshViewportPins={refreshViewportPins}
      />

      {/* 상단 검색 + 필터 + 토글 */}
      <TopRegion
        ref={rightAreaRef}
        q={q}
        onChangeQ={onChangeQ}
        onSubmitSearch={handleSubmitSearch}
        activeMenu={activeMenu}
        onChangeFilter={(next: MapMenuKey) => {
          const resolved: MapMenuKey = next === activeMenu ? "all" : next;
          (onChangeFilter as any)(resolved);
        }}
        isDistrictOn={isDistrictOn}
        setIsDistrictOn={handleSetDistrictOn}
        poiKinds={[...poiKinds]}
        onChangePoiKinds={onChangePoiKinds}
        roadviewVisible={roadviewVisible}
        onToggleRoadview={toggleRoadview}
        rightOpen={rightOpen}
        setRightOpen={handleSetRightOpen}
        sidebarOpen={useSidebar}
        onToggleSidebar={handleToggleSidebar}
        getBounds={getBoundsLLB}
        getLevel={() => mapInstance?.getLevel?.()}
        roadviewRoadOn={roadviewRoadOn}
        onToggleRoadviewRoad={toggleRoadviewRoad}
      />

      {/* 필터 플로팅 버튼 + 필터 검색 패널 영역 */}
      <div ref={filterAreaRef}>
        <FilterFab onOpen={handleOpenFilterSearch} />

        <FilterSearch
          isOpen={filterSearchOpen}
          onClose={() => setFilterSearchOpen(false)}
          onApply={handleApplyFilters}
          onClear={clearSearch}
        />
      </div>

      {/* 사이드바 영역 */}
      <div ref={sidebarAreaRef}>
        <Sidebar
          isSidebarOn={useSidebar}
          onToggleSidebar={handleToggleSidebar}
          onFocusItemMap={handleFocusItemMap}
          onFocusSubItemMap={handleFocusSubItemMap}
        />
      </div>

      <ModalsHost
        viewOpen={viewOpenLocal}
        selectedViewItem={selectedViewForModal}
        onCloseView={handleCloseView}
        onSaveViewPatch={onSaveViewPatch}
        onDeleteFromView={handleDeleteFromView}
        createOpen={createOpen}
        prefillAddress={prefillAddress}
        draftPin={draftPin}
        selectedPos={selectedPos}
        createHostHandlers={{
          ...createHostHandlers,
          onAfterCreate: handleAfterCreate,
          onOpenViewAfterCreate: handleOpenViewAfterCreate,
        }}
        pinDraftId={
          createFromDraftId != null ? Number(createFromDraftId) : undefined
        }
        roadviewVisible={roadviewVisible}
        roadviewContainerRef={roadviewContainerRef}
        onCloseRoadview={close}
        createPinKind={createPinKind ?? null}
        draftHeaderPrefill={draftHeaderPrefill ?? undefined}
      />

      {/* 🔔 필터 검색 결과 없음 모달 */}
      <NoResultDialog
        open={noResultDialogOpen}
        onOpenChange={setNoResultDialogOpen}
        onResetFilters={() => {
          clearSearch();
          setFilterSearchOpen(true);
        }}
      />
    </div>
  );
}

export default MapHomeUI;
