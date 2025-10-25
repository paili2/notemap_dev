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
import type {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { searchPins } from "@/shared/api/pins";

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

  /** 로컬 임시 draft 마커 상태 (신규 등록 직후 즉시 표시용) */
  const [localDraftMarkers, setLocalDraftMarkers] = useState<MapMarker[]>([]);

  // ── 검색 상태 ─────────────────────────────────────
  const [filterParams, setFilterParams] = useState<PinSearchParams | null>(
    null
  );
  const [searchRes, setSearchRes] = useState<PinSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 검색 결과 bounds 맞추기(선택)
  const fitToSearch = useCallback(
    (res: PinSearchResult) => {
      if (!kakaoSDK || !mapInstance) return;
      const coords = [
        ...(res.pins ?? []).map((p) => ({ lat: p.lat, lng: p.lng })),
        ...(res.drafts ?? []).map((d) => ({ lat: d.lat, lng: d.lng })),
      ];
      if (!coords.length) return;
      const bounds = new kakaoSDK.maps.LatLngBounds();
      coords.forEach((c) =>
        bounds.extend(new kakaoSDK.maps.LatLng(c.lat, c.lng))
      );
      try {
        mapInstance.setBounds(bounds);
      } catch {}
    },
    [kakaoSDK, mapInstance]
  );

  // PinSearchResult → useMergedMarkers용 평면 좌표 배열
  const toServerPointsFromPins = useCallback(
    (pins: NonNullable<PinSearchResult["pins"]>) =>
      pins.map((p) => ({
        id: String(p.id),
        title: p.addressLine ?? undefined,
        lat: p.lat,
        lng: p.lng,
      })),
    []
  );

  const toServerDraftsFromDrafts = useCallback(
    (drafts: NonNullable<PinSearchResult["drafts"]>) =>
      drafts.map((d) => ({
        id: `__draft__${d.id}`,
        title: d.addressLine ?? undefined,
        lat: d.lat,
        lng: d.lng,
        draftState: (d as any).draftState, // 있을 경우만
      })),
    []
  );

  // 필터 적용 시 /pins/search 호출
  const handleApplyFilters = useCallback(
    async (params: PinSearchParams) => {
      setFilterParams(params);
      setFilterSearchOpen(false);
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await searchPins(params);
        setSearchRes(res); // 결과가 있는 동안은 뷰포트 데이터 대신 이걸 사용
        fitToSearch(res); // 선택: 결과 영역으로 이동
      } catch (e: any) {
        setSearchError(e?.message ?? "검색 실패");
        setSearchRes(null);
      } finally {
        setSearchLoading(false);
      }
    },
    [fitToSearch]
  );

  // 검색 해제(선택): viewport 기반으로 복귀
  const clearSearch = useCallback(() => {
    setFilterParams(null);
    setSearchRes(null);
    setSearchError(null);
  }, []);

  /** 임시 마커 주입/치환/초기화 유틸 */
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
          title: m.address ?? "선택 위치",
          position: { lat: m.lat, lng: m.lng },
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

  // 필터 → draftState 매핑
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

  // ===== 서버 핀 로딩(뷰포트 기반) =====
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

  // 검색 결과가 있으면 그걸 사용, 없으면 기존 뷰포트 데이터 사용
  const effectiveServerPoints = useMemo(
    () =>
      searchRes?.pins
        ? toServerPointsFromPins(searchRes.pins)
        : normServerPoints,
    [searchRes?.pins, normServerPoints, toServerPointsFromPins]
  );

  const effectiveServerDrafts = useMemo(
    () =>
      searchRes?.drafts
        ? toServerDraftsFromDrafts(searchRes.drafts)
        : normServerDrafts,
    [searchRes?.drafts, normServerDrafts, toServerDraftsFromDrafts]
  );

  // ===== 마커 병합 =====
  const { mergedMarkers, mergedWithTempDraft, mergedMeta } = useMergedMarkers({
    localMarkers: useMemo(
      () => [...(markers ?? []), ...localDraftMarkers],
      [markers, localDraftMarkers]
    ),
    serverPoints: effectiveServerPoints,
    serverDrafts: effectiveServerDrafts,
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
  } = useRoadview({
    kakaoSDK,
    map: mapInstance,
    autoSync: true,
  });

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

  // 뷰포트 핀 재패치 트리거 (훅이 idle 이벤트를 듣는 경우 대비)
  const refreshViewportPins = useCallback(
    async (_box?: {
      sw: { lat: number; lng: number };
      ne: { lat: number; lng: number };
    }) => {
      if (!kakaoSDK || !mapInstance) return;
      try {
        const c = mapInstance.getCenter();
        const level = mapInstance.getLevel();
        mapInstance.setLevel(level + 1, { animate: false });
        mapInstance.setLevel(level, { animate: false });
        mapInstance.setCenter(c);
      } catch {}
    },
    [kakaoSDK, mapInstance]
  );

  // 주소/키워드 검색 → 지도 이동(뷰포트 훅이 idle 이벤트를 통해 데이터 갱신)
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
        mapInstance.setCenter(target);
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
        pinsLoading={pinsLoading || searchLoading} // 로딩 합산
        pinsError={pinsError || searchError} // 에러 합산
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
        onApply={handleApplyFilters}
        onClear={clearSearch} // 선택: 검색 해제(필터 초기화 시 호출)
        // initial={...}                 // 선택: 이전 필터 복구를 원하면 FilterState 형태로 넣으면됨
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
