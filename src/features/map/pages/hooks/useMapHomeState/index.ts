"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { LatLng } from "@/lib/geo/types";

import { useToast } from "@/hooks/use-toast";
import { useResolveAddress } from "@/hooks/useResolveAddress";
import { useViewportPost } from "../../../hooks/useViewportPost";
import { usePinsMap } from "../../../hooks/usePinsMap";
import { usePanToWithOffset } from "../../../hooks/useKakaoTools";

import type { MapToolMode, Viewport } from "./mapHome.types";
import { sameViewport } from "./mapHome.utils";
import { useMenuAndDraft } from "./useMenuAndDraft";
import { usePropertyModals } from "./usePropertyModals";
import { useSearchAndPoi } from "./useSearchAndPoi";

export function useMapHomeState() {
  // 지도/SDK
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);
  const { toast } = useToast();

  // 토글/필터 (지도 툴 모드, 사이드바)
  const [mapToolMode, setMapToolMode] = useState<MapToolMode>("none");
  const [useSidebar, setUseSidebar] = useState<boolean>(false);

  /** 파생: 지적편집도 / 로드뷰 상태 */
  const useDistrict = mapToolMode === "district";
  const roadviewVisible = mapToolMode === "roadview";

  /** 지적편집도 토글 (배타적) */
  const toggleDistrict = useCallback(() => {
    setMapToolMode((prev) => (prev === "district" ? "none" : "district"));
  }, []);

  /** 로드뷰 토글 (배타적) */
  const toggleRoadview = useCallback(() => {
    setMapToolMode((prev) => (prev === "roadview" ? "none" : "roadview"));
  }, []);

  /** 기존 setUseDistrict 인터페이스 호환용 */
  const setUseDistrict = useCallback((next: boolean) => {
    setMapToolMode((prev) => {
      if (next) return "district";
      return prev === "district" ? "none" : prev;
    });
  }, []);

  /** 필요 시 로드뷰도 직접 세트할 수 있게 */
  const setRoadviewVisible = useCallback((next: boolean) => {
    setMapToolMode((prev) => {
      if (next) return "roadview";
      return prev === "roadview" ? "none" : prev;
    });
  }, []);

  // 데이터 (ViewModal 목록용)
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [addFav] = useState<boolean>(false); // (지금은 미사용이지만 기존 인터페이스 유지용)

  // 뷰포스트 & 서버 핀
  const postViewport = useViewportPost();
  const lastViewportRef = useRef<Viewport | null>(null);
  const { points, drafts, setBounds, refetch } = usePinsMap();

  // 방금 등록된 draft 숨김 관리 (⭐ usePropertyModals보다 위로 이동)
  const [hiddenDraftIds, setHiddenDraftIds] = useState<Set<string>>(new Set());
  const hideDraft = useCallback(
    (draftId: string | number | null | undefined) => {
      if (draftId == null) return;
      const key = String(draftId);
      setHiddenDraftIds((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    []
  );
  const clearHiddenDraft = useCallback((draftId: string | number) => {
    const key = String(draftId);
    setHiddenDraftIds((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  // 뷰포트 전송 (pins/poi 쿼리용)
  const sendViewportQuery = useCallback(
    (vp: Viewport, opts?: { force?: boolean }) => {
      if (!opts?.force && sameViewport(vp, lastViewportRef.current)) return;
      lastViewportRef.current = vp;

      (postViewport as any)?.sendViewportQuery
        ? (postViewport as any).sendViewportQuery(vp)
        : (postViewport as any)(vp);

      if (kakaoSDK && mapInstance) {
        kakaoSDK.maps.event.trigger(mapInstance, "idle");
        requestAnimationFrame(() =>
          kakaoSDK.maps.event.trigger(mapInstance, "idle")
        );
      }

      try {
        const sw = vp.leftBottom;
        const ne = vp.rightTop;
        setBounds({
          swLat: sw.lat,
          swLng: sw.lng,
          neLat: ne.lat,
          neLng: ne.lng,
        });
      } catch {}
    },
    [postViewport, kakaoSDK, mapInstance, setBounds]
  );

  const lastViewport = lastViewportRef.current;

  // 공통 유틸
  const resolveAddress = useResolveAddress(kakaoSDK);
  const panToWithOffset = usePanToWithOffset(kakaoSDK, mapInstance);

  // ───────── 메뉴/드래프트 훅 ─────────
  const {
    hideLabelForId,
    onChangeHideLabelForId,
    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    draftPin,
    setDraftPin,
    createFromDraftId,
    setCreateFromDraftId,
    setRawMenuAnchor,
    openMenuAt,
    focusAndOpenAt,
    focusMapTo,
    handleMarkerClick,
    closeMenu,
    onPlanFromMenu,
    onOpenMenu,
  } = useMenuAndDraft({
    kakaoSDK,
    mapInstance,
    items,
    drafts,
    toast,
    resolveAddress,
    panToWithOffset,
  });

  // ───────── 검색/POI 훅 ─────────
  const {
    filtered,
    q,
    setQ,
    filter,
    setFilter,
    onChangeQ,
    onChangeFilter,
    runSearch,
    handleSearchSubmit,
    onSubmitSearch,
    poiKinds,
    setPoiKinds,
    onChangePoiKinds,
  } = useSearchAndPoi({
    kakaoSDK,
    mapInstance,
    points,
    items,
    toast,
    lastViewportRef,
    sendViewportQuery,
    refetch,
    onMatchedPin: async (p: any) => {
      // ✅ 기존 runSearchRaw onMatchedPin 동작 그대로
      setDraftPin(null);
      setCreateFromDraftId(null);

      const pos = { lat: p.position.lat, lng: p.position.lng };

      console.log("[useMapHomeState/runSearch] matched pin by search:", {
        id: p.id,
        name: (p as any).name,
        address: (p as any).address,
        pos,
      });

      await focusAndOpenAt(pos as LatLng, String(p.id));
    },
    onNoMatch: async (coords: LatLng) => {
      // ✅ 매칭 핀이 없을 때만 진짜 draft 모드로 전환
      setCreateFromDraftId(null);

      console.log(
        "[useMapHomeState/runSearch] no matched pin, open draft at:",
        coords
      );

      await focusAndOpenAt(coords, "__draft__");
    },
  });

  // ───────── 매물 모달 훅 ─────────
  const {
    // selection
    selectedId,
    setSelectedId,
    selected,
    selectedViewItem,
    selectedPos,

    // modals
    viewOpen,
    setViewOpen,
    editOpen,
    setEditOpen,
    createOpen,
    setCreateOpen,
    prefillAddress,
    closeCreate,
    closeView,
    closeEdit,
    onEditFromView,

    // view/edit handlers
    onSaveViewPatch,
    onDeleteFromView,
    onSubmitEdit,

    // create from menu
    createPos, // (외부에 직접 줄 필요는 없지만, selectedPos 계산용으로 사용)
    createPinKind,
    setCreatePinKind,
    draftHeaderPrefill,
    openViewFromMenu,
    openCreateFromMenu,
    onViewFromMenu,
    onCreateFromMenu,

    // host bridge
    createHostHandlers,
    editHostHandlers,
  } = usePropertyModals({
    items,
    setItems,
    drafts,
    draftPin,
    menuAnchor,
    menuRoadAddr,
    menuJibunAddr,
    createFromDraftId,
    setCreateFromDraftId,
    setDraftPinSafe: setDraftPin,
    hideDraft,
    refetch,
    closeMenu,
  });

  // 마커 클릭 (매물핀 / __visit__ / __draft__ 모두 지원)
  const onMarkerClick = handleMarkerClick;

  // 지도 준비
  const [fitAllOnce, setFitAllOnce] = useState(false);
  const onMapReady = useCallback(
    ({ kakao, map }: any) => {
      setKakaoSDK(kakao);
      setMapInstance(map);
      requestAnimationFrame(() => setFitAllOnce(false));
      setTimeout(() => {
        map.relayout?.();
        kakao.maps.event.trigger(map, "resize");
        kakao.maps.event.trigger(map, "idle");
      }, 0);

      try {
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        setBounds({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        });
        refetch();
      } catch {}
    },
    [refetch, setBounds]
  );

  // ⭐ 마커 목록 (필터 반영)
  const markers = useMemo(() => {
    // 0) drafts 배열에서 숨긴 것 제외
    const visibleDraftsRaw = (drafts ?? []).filter(
      (d: any) => !hiddenDraftIds.has(String(d.id))
    );

    // 1) 필터 모드 판별
    const isPlannedOnlyMode = filter === "plannedOnly";

    // 2) 매물핀: plannedOnly 모드에서는 안 보이게
    const visiblePoints = isPlannedOnlyMode ? [] : points ?? [];

    // 3) 임시핀: plannedOnly 모드일 때는 draftState === "BEFORE" 만 남기기
    const visibleDrafts = visibleDraftsRaw.filter((d: any) => {
      if (!isPlannedOnlyMode) return true;
      const state = d.draftState as "BEFORE" | "SCHEDULED" | undefined;
      return state === "BEFORE";
    });

    // 4) 매물핀 마커 변환
    const pointMarkers = visiblePoints.map((p: any) => ({
      id: String(p.id),
      position: { lat: p.lat, lng: p.lng },
      kind: "1room" as const,
      title: p.badge ?? "",
      isFav: false,
    }));

    // 5) 임시핀 마커 변환 (__visit__ 접두사)
    const draftMarkers = visibleDrafts.map((d: any) => ({
      id: `__visit__${d.id}`,
      position: { lat: d.lat, lng: d.lng },
      kind: "question" as const,
      isFav: false,
    }));

    // 6) 화면에서 선택한 임시 draftPin
    const draftPinMarker = draftPin
      ? [
          {
            id: "__draft__",
            position: draftPin,
            kind: "question" as const,
            isFav: false,
          },
        ]
      : [];

    return [...pointMarkers, ...draftMarkers, ...draftPinMarker];
  }, [points, drafts, draftPin, hiddenDraftIds, filter]);

  const onViewportChange = useCallback(
    (vp: any, opts?: { force?: boolean }) => sendViewportQuery(vp, opts),
    [sendViewportQuery]
  );

  return {
    // sdk/map
    kakaoSDK,
    mapInstance,
    onMapReady,
    sendViewportQuery,
    lastViewport,

    // data
    items,
    setItems,
    filtered,

    // markers
    fitAllOnce,
    setFitAllOnce,
    markers,

    // selection
    selectedId,
    setSelectedId,
    selected,

    // search/filter
    q,
    setQ,
    filter,
    setFilter,
    runSearch,
    handleSearchSubmit,
    onChangeQ,
    onChangeFilter,
    onSubmitSearch,

    // toggles
    useSidebar,
    setUseSidebar,
    mapToolMode,
    useDistrict,
    setUseDistrict,
    roadviewVisible,
    setRoadviewVisible,
    toggleDistrict,
    toggleRoadview,

    // POI
    poiKinds,
    setPoiKinds,
    onChangePoiKinds,

    // menu
    menuOpen,
    menuAnchor,
    menuTargetId,
    menuRoadAddr,
    menuJibunAddr,
    closeMenu,
    openViewFromMenu,
    openCreateFromMenu,
    onCloseMenu: closeMenu,
    onViewFromMenu,
    onCreateFromMenu,
    onOpenMenu,
    onPlanFromMenu,

    // draft
    draftPin,
    setDraftPin,
    createPinKind,
    setCreatePinKind,

    // marker / viewport
    handleMarkerClick,
    onMarkerClick,
    onViewportChange,

    // modals
    addFav,
    viewOpen,
    setViewOpen,
    editOpen,
    setEditOpen,
    createOpen,
    setCreateOpen,
    prefillAddress,
    closeCreate,
    closeView,
    closeEdit,
    onEditFromView,

    // view handlers
    onSaveViewPatch,
    onDeleteFromView,
    selectedViewItem,

    // host bridges
    createHostHandlers,
    editHostHandlers,

    // misc
    selectedPos,
    hideLabelForId,
    onChangeHideLabelForId,

    // 숨김 제어
    hideDraft,
    clearHiddenDraft,
    createFromDraftId,

    // ⭐ 외부에서 지도 포커스 이동용
    focusMapTo,
    draftHeaderPrefill,
  } as const;
}
