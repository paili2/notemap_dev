// features/map/pages/MapHomeUI/MapHomeUI.tsx
"use client";

import { useCallback, useMemo, useState, useEffect } from "react";

import { useSidebar as useSidebarCtx, Sidebar } from "@/features/sidebar";

import { useMergedMarkers } from "../hooks/useMergedMarkers";
import MapCanvas from "../components/MapCanvas";
import ContextMenuHost from "../components/ContextMenuHost/ContextMenuHost";
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

import { useViewModalState } from "./hooks/useViewModalState";
import { usePanelsAndToggles } from "./hooks/usePanelsAndToggles";

/* 🔎 검색 / 필터 훅들 */
import { useFilterSearch } from "./hooks/useFilterSearch";
import { useViewportPinsForMapHome } from "./hooks/useViewportPinsForMapHome";
import { useAfterCreateHandler } from "./hooks/useAfterCreateHandler";

/* 👀 지도 포커스 유틸 */
import { focusMapToPosition } from "./lib/viewUtils";
import { TopRegion } from "./components/TopRegion";
import usePlaceSearchOnMap from "./hooks/usePlaceSearchOnMap";
import { hideLabelsAround } from "@/features/map/view/overlays/labelRegistry";

type ViewportBounds = {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
};

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

  // 🔁 메뉴 오픈 핸들러 래핑: 클릭된 핀 id 기준으로 라벨 숨김
  const handleOpenMenuInternal = useCallback(
    (args: {
      position: { lat: number; lng: number };
      propertyId: string | number;
      propertyTitle: string;
      pin?: { kind: PinKind; isFav: boolean };
      // searchPlaceOnMap 쪽에서만 넣는 디버그 필드
      source?: string;
    }) => {
      const idStr = String(args.propertyId);

      if (process.env.NODE_ENV !== "production") {
        console.log("[MapHomeUI] handleOpenMenuInternal", {
          from: (args as any).source ?? "unknown",
          propertyId: args.propertyId,
          idStr,
          prevHideLabelForId: hideLabelForId,
          menuOpen,
          menuAnchor,
        });
      }

      // 🔥 임시핀(__search__)이든 실핀이든 "그 핀 id 그대로"
      onChangeHideLabelForId?.(idStr);

      onOpenMenu?.(args);
    },
    [onOpenMenu, onChangeHideLabelForId, hideLabelForId, menuOpen, menuAnchor]
  );

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
    onOpenMenu: handleOpenMenuInternal,
    onChangeHideLabelForId,
    menuOpen,
    menuAnchor,
    hideLabelForId: hideLabelForId ?? undefined,
    onMarkerClick,
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

  // ✅ 메뉴가 열려 있으면 menuTargetId 기준으로 라벨 숨김 강제
  const effectiveHideLabelForId = useMemo(() => {
    if (menuOpen && menuTargetId != null) {
      return String(menuTargetId);
    }
    return hideLabelForId ?? undefined;
  }, [menuOpen, menuTargetId, hideLabelForId]);

  const visibleMarkers = useMemo(
    () => mergedWithTempDraft,
    [mergedWithTempDraft]
  );

  // 🔄 메뉴가 열린 상태에서 마커 세트가 바뀌면 앵커 주변 라벨 다시 숨기기
  useEffect(() => {
    if (!menuOpen || !menuAnchor) return;
    if (!kakaoSDK || !mapInstance) return;

    try {
      hideLabelsAround(mapInstance, menuAnchor.lat, menuAnchor.lng, 56);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[MapHomeUI] hideLabelsAround on markers change error", e);
      }
    }
  }, [menuOpen, menuAnchor, visibleMarkers, kakaoSDK, mapInstance]);

  // 🔄 /map 다시 치도록 하는 함수: 현재 뷰포트(또는 overrideBounds)로 onViewportChange 호출
  const refreshViewportPins = useCallback(
    (overrideBounds?: ViewportBounds) => {
      if (!onViewportChange) return;

      let viewport: ViewportBounds | null = overrideBounds ?? null;

      if (!viewport && mapInstance?.getBounds) {
        try {
          const b = mapInstance.getBounds();
          viewport = {
            sw: {
              lat: b.getSouthWest().getLat(),
              lng: b.getSouthWest().getLng(),
            },
            ne: {
              lat: b.getNorthEast().getLat(),
              lng: b.getNorthEast().getLng(),
            },
          };
        } catch {
          viewport = null;
        }
      }

      if (!viewport) return;

      onViewportChange(viewport as any);
    },
    [onViewportChange, mapInstance]
  );

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
        hideLabelForId={effectiveHideLabelForId}
        onMarkerClick={onMarkerClick}
        onOpenMenu={handleOpenMenuInternal}
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
          onAfterCreate: async (res) => {
            await handleAfterCreate(res);
          },
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
        onLabelChanged={() => refreshViewportPins()}
        refetchPins={() => refreshViewportPins()}
      />

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
