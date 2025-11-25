"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { FilterSearch } from "../../../shared/filterSearch";

import { useSidebar as useSidebarCtx, Sidebar } from "@/features/sidebar";
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
import SearchForm from "@/features/map/view/top/SearchForm/SearchForm";
import type { MapMarker } from "../../../shared/types/map";
import type { PinKind } from "@/features/pins/types";
import type {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { searchPins, togglePinDisabled } from "@/shared/api/pins";

/* ✅ 상세보기 데이터 패칭 & 뷰모델 변환 */
import { getPinRaw } from "@/shared/api/getPin";
import { toViewDetailsFromApi } from "@/features/properties/lib/view/toViewDetailsFromApi";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";

/* 라벨 숨김/복원 */
import {
  hideLabelsAround,
  showLabelsAround,
} from "@/features/map/shared/overlays/labelRegistry";
import { MapMenuKey } from "@/features/map/menu";
import { usePinsFromViewport } from "@/features/map/shared/hooks/usePinsFromViewport";
import { useRoadview } from "@/features/map/shared/hooks/useRoadview";

/* 검색 위치와 현재 뷰 중앙 거리 계산용 */
import { distM } from "@/features/map/shared/hooks/poi/geometry";

/* ------------------------- 검색 유틸 ------------------------- */
function parseStationAndExit(qRaw: string) {
  const q = qRaw.trim().replace(/\s+/g, " ");
  const exitMatch = q.match(/(\d+)\s*번\s*출구/);
  const exitNo = exitMatch ? Number(exitMatch[1]) : null;
  const station = q
    .replace(/(\d+)\s*번\s*출구/g, "")
    .replace(/역/g, "")
    .trim();
  return { stationName: station, exitNo, hasExit: exitNo !== null, raw: q };
}

const norm = (s: string) => (s || "").replace(/\s+/g, "");

function pickBestStation(data: any[], stationName: string) {
  const s = norm(stationName);
  const stations = data.filter((d) => d.category_group_code === "SW8");
  const cand = stations.length ? stations : data;
  return (
    cand.find((d) => norm(d.place_name) === norm(`${stationName}역`)) ||
    cand.find((d) => norm(d.place_name).includes(s)) ||
    cand[0]
  );
}

// 출구 번호 추출
function extractExitNo(name: string): number | null {
  const n1 = name.match(/(\d+)\s*번\s*출구/);
  const n2 = name.match(/(\d+)\s*번출구/);
  const n3 = name.match(/[①②③④⑤⑥⑦⑩]/);
  if (n1) return Number(n1[1]);
  if (n2) return Number(n2[1]);
  if (n3) return "①②③④⑤⑥⑦⑧⑨⑩".indexOf(n3[0]) + 1;
  return null;
}

function pickBestExitStrict(
  data: any[],
  stationName: string,
  want?: number | null,
  stationLL?: kakao.maps.LatLng
) {
  if (!data?.length) return null;
  const n = (s: string) => (s || "").replace(/\s+/g, "");
  const sNorm = n(`${stationName}역`);

  const withStation = data.filter(
    (d) => /출구/.test(d.place_name) && n(d.place_name).includes(n(stationName))
  );
  const pool = withStation.length
    ? withStation
    : data.filter((d) => /출구/.test(d.place_name)) || data;

  const scored = pool.map((d) => {
    const no = extractExitNo(d.place_name);
    let score = 0;
    if (want != null && no === want) score += 1000;
    if (n(d.place_name).includes(sNorm)) score += 50;

    let dist = Number(d.distance ?? 999_999);
    if (isNaN(dist) && stationLL) {
      const dy = Math.abs(Number(d.y) - stationLL.getLat());
      const dx = Math.abs(Number(d.x) - stationLL.getLng());
      dist = Math.sqrt(dx * dx + dy * dy) * 111_000;
    }
    score += Math.max(0, 500 - Math.min(dist, 500));
    return { d, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.d ?? data[0];
}

/* ------ 일반 장소(학교 가중) ------ */
function scorePlaceForSchool(item: any, keywordNorm: string) {
  const nameN = norm(item.place_name);
  const cat = (item.category_name || "").replace(/\s+/g, "");
  let s = 0;

  if (nameN === keywordNorm) s += 1000;
  if (nameN.startsWith(keywordNorm)) s += 400;
  if (nameN.includes(keywordNorm)) s += 150;

  if (/학교|대학교|캠퍼스|정문|본관/.test(item.place_name)) s += 300;
  if (/학교|대학교/.test(cat)) s += 250;

  if (/숲|산|등산|둘레길|산책로|야외|야영/.test(item.place_name)) s -= 500;
  if (/[로|길]$/.test(item.place_name)) s -= 300;

  const dist = Number(item.distance ?? 999_999);
  if (!isNaN(dist)) s += Math.max(0, 400 - Math.min(dist, 400));
  return s;
}

function pickBestPlace(
  data: any[],
  keyword: string,
  center?: kakao.maps.LatLng | null
) {
  if (!data?.length) return null;
  const kw = norm(keyword);

  const exact = data.find((d) => norm(d.place_name) === kw);
  if (exact) return exact;
  const starts = data.find((d) => norm(d.place_name).startsWith(kw));
  if (starts) return starts;
  const partial = data.find((d) => norm(d.place_name).includes(kw));
  if (partial) return partial;

  if (center) {
    const withDist = data
      .map((d) => ({ d, dist: Number(d.distance ?? Infinity) }))
      .sort((a, b) => a.dist - b.dist);
    if (withDist[0]?.d) return withDist[0].d;
  }
  return data[0];
}

/* 🔍 검색 결과에 핀을 찍을지 판정 */
function shouldCreateSearchPin(item: any, keyword: string) {
  // 1) 카테고리 있는 애들(지하철역, 편의시설 등)은 신뢰하고 핀 생성
  if (item.category_group_code) return true;

  const addr =
    item.road_address_name ||
    item.address_name ||
    item.address?.address_name ||
    "";
  const name = item.place_name || addr || keyword;

  // 2) "대한민국", "○○시청/구청/도청" 같은 큰 단위는 핀 없이 이동만
  const bigRegionPattern = /(대한민국|청사|도청|시청|구청)$/;
  if (bigRegionPattern.test(name) || bigRegionPattern.test(addr)) {
    return false;
  }

  // 3) "○○시" 단독(동/읍/면/리 없이)만 검색된 경우도 핀 없이 이동만
  if (/^(.*(시|군|구))$/.test(name) && !/(동|읍|면|리)/.test(name)) {
    return false;
  }

  // 4) 나머지(아파트, 상가, 동 단위, 반포자이 등)는 핀 허용
  return true;
}

/* ------------------------------------------------------------ */
/*                    🔧 EDIT 주입 보장 유틸                     */
/* ------------------------------------------------------------ */

function ensureViewForEdit(
  v: PropertyViewDetails | (PropertyViewDetails & { editInitial?: any }) | null
): (PropertyViewDetails & { editInitial: any }) | null {
  if (!v) return null;

  const id = (v as any).id ?? (v as any)?.view?.id ?? undefined;
  const view = { ...(v as any), ...(id != null ? { id } : {}) };

  if ((view as any).editInitial?.view) {
    return view as any;
  }
  return {
    ...(view as any),
    editInitial: { view: { ...(view as any) } },
  } as any;
}

/* =================================================================== */

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

  const [localDraftMarkers, setLocalDraftMarkers] = useState<MapMarker[]>([]);
  const [, setFilterParams] = useState<PinSearchParams | null>(null);
  const [searchRes, setSearchRes] = useState<PinSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [viewOpenLocal, setViewOpenLocal] = useState(false);
  const [viewDataLocal, setViewDataLocal] =
    useState<PropertyViewDetails | null>(null);

  // 🔐 마지막 검색 기준 중심(지도의 center)을 기억해서, 멀리 이동했을 때만 검색핀 제거
  const lastSearchCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  const handleViewFromMenuLocal = useCallback(async (pinId: string) => {
    setViewOpenLocal(true);
    setViewDataLocal(null);
    try {
      const apiPin = await getPinRaw(pinId);
      const base = toViewDetailsFromApi(apiPin) as PropertyViewDetails;
      const ensured = ensureViewForEdit({
        ...base,
        id: (base as any).id ?? pinId,
      });
      setViewDataLocal(ensured as any);
    } catch (e) {
      console.error(e);
      setViewOpenLocal(false);
    }
  }, []);

  const handleViewFromMenu = useCallback(
    (id: string) => {
      if (typeof onViewFromMenu === "function") onViewFromMenu(id);
      else handleViewFromMenuLocal(id);
    },
    [onViewFromMenu, handleViewFromMenuLocal]
  );

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

  const toServerPointsFromPins = useCallback(
    (pins: NonNullable<PinSearchResult["pins"]>) =>
      pins.map((p) => {
        const displayName = (p.name ?? "").trim(); // ← 매물명

        return {
          id: String(p.id),
          name: displayName, // ✅ 라벨에서 우선 사용
          title: displayName, // ✅ 혹시 모를 fallback
          lat: p.lat,
          lng: p.lng,
          badge: p.badge ?? null, // ✅ 뱃지도 있으면 같이 넘겨주기
        };
      }),
    []
  );

  const toServerDraftsFromDrafts = useCallback(
    (drafts: NonNullable<PinSearchResult["drafts"]>) =>
      drafts.map((d) => {
        const label = (d.title ?? "답사예정").trim();

        return {
          id: d.id, // 여기서는 굳이 __draft__ 안 붙여도 돼
          name: label,
          title: label,
          lat: d.lat,
          lng: d.lng,
          draftState: (d as any).draftState,
          badge: d.badge ?? null,
        };
      }),
    []
  );

  const handleApplyFilters = useCallback(
    async (params: PinSearchParams) => {
      setFilterParams(params);
      setFilterSearchOpen(false);
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await searchPins(params);
        setSearchRes(res);
        fitToSearch(res);
      } catch (e: any) {
        setSearchError(e?.message ?? "검색 실패");
        setSearchRes(null);
      } finally {
        setSearchLoading(false);
      }
    },
    [fitToSearch]
  );

  const clearSearch = useCallback(() => {
    setFilterParams(null);
    setSearchRes(null);
    setSearchError(null);
  }, []);

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

  // 원래 createHostHandlers.onAfterCreate 백업
  const originalOnAfterCreate = createHostHandlers?.onAfterCreate;

  /** ✅ 생성/답사예정 등록 후 후처리 */
  const handleAfterCreate = useCallback(
    (args: any) => {
      // 1) 답사예정핀 전용 모드면: 모달 / 상세뷰 전부 닫고 끝내기
      if (args?.mode === "visit-plan-only") {
        // 생성 모달/상태 정리
        createHostHandlers?.resetAfterCreate?.();
        createHostHandlers?.onClose?.();

        // 혹시 상세보기 모달 떠 있으면 같이 닫기
        closeView?.();

        return;
      }

      // 2) 일반 매물 등록 로직 (기존과 동일)
      const { pinId, matchedDraftId, lat, lng } = args || {};
      if (!pinId) {
        // pinId 없으면 할 일이 없음
        return;
      }

      if (matchedDraftId != null) {
        replaceTempByRealId(matchedDraftId, pinId);
      } else {
        upsertDraftMarker({
          id: `__visit__${pinId}`,
          lat,
          lng,
          address: null,
          source: "draft",
        });
      }

      // 3) 기존 onAfterCreate(드래프트 숨김 / refetch 등)도 호출
      originalOnAfterCreate?.(args);
    },
    [
      closeView,
      createHostHandlers,
      originalOnAfterCreate,
      replaceTempByRealId,
      upsertDraftMarker,
    ]
  );

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

  // 🔹 사이드바 필터를 /pins/map isNew / isOld 쿼리로 매핑
  const isNewFlag = useMemo(
    () => (filter === "new" ? true : undefined),
    [filter]
  );
  const isOldFlag = useMemo(
    () => (filter === "old" ? true : undefined),
    [filter]
  );

  const {
    points: serverPoints,
    drafts: serverDrafts,
    loading: pinsLoading,
    error: pinsError,
  } = usePinsFromViewport({
    map: mapInstance,
    debounceMs: 300,
    draftState: draftStateForQuery,
    isNew: isNewFlag,
    isOld: isOldFlag,
  });

  const normServerPoints = useMemo(
    () =>
      serverPoints?.map((p) => ({ ...p, title: p.title ?? undefined })) ?? [],
    [serverPoints]
  );
  const normServerDrafts = useMemo(
    () =>
      serverDrafts?.map((d) => ({ ...d, title: d.title ?? undefined })) ?? [],
    [serverDrafts]
  );

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

  usePlannedDrafts({ filter, getBounds: getBoundsRaw });

  const {
    roadviewContainerRef,
    visible: roadviewVisible,
    openAtCenter,
    openAt,
    close,
  } = useRoadview({ kakaoSDK, map: mapInstance, autoSync: true });

  // ✅ 지적편집도 상태는 여기서 선언 (로드뷰 토글보다 위)
  const [isDistrictOn, setIsDistrictOnState] = useState(false);

  const toggleRoadview = useCallback(() => {
    if (roadviewVisible) {
      // ✅ 로드뷰가 켜져 있으면 끄기만
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

    // ✅ 먼저 로드뷰를 연다
    if (anchor) {
      openAt(anchor, { face: anchor });
    } else {
      openAtCenter();
    }

    // ✅ 그리고 바로 지적편집도를 끈다 (시각적으로는 거의 동시에 꺼짐)
    if (isDistrictOn) {
      setIsDistrictOnState(false);
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

  const [rightOpen, setRightOpen] = useState(false);
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);

  // 🔵 로드뷰 도로(파란 라인) on/off 상태
  const [roadviewRoadOn, setRoadviewRoadOn] = useState(false);

  // 🔵 토글 영역 refs (오른쪽 패널 / 필터 영역 / 사이드바)
  const rightAreaRef = useRef<HTMLDivElement | null>(null);
  const filterAreaRef = useRef<HTMLDivElement | null>(null);
  const sidebarAreaRef = useRef<HTMLDivElement | null>(null);

  // 🔵 바깥 클릭 시 세 토글 모두 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rightOpen && !filterSearchOpen && !useSidebar) return;

      const target = event.target as Node | null;
      if (!target) return;

      if (
        rightAreaRef.current?.contains(target) ||
        filterAreaRef.current?.contains(target) ||
        sidebarAreaRef.current?.contains(target)
      ) {
        // 토글 영역 안쪽 클릭이면 유지
        return;
      }

      // 그 외(지도, 다른 UI 등)를 클릭하면 세 토글 모두 닫기
      setRightOpen(false);
      setFilterSearchOpen(false);
      setUseSidebar(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [rightOpen, filterSearchOpen, useSidebar, setUseSidebar]);

  // 🔁 오른쪽 토글과 필터검색, 사이드바 상호 배타 제어
  const handleSetDistrictOn = useCallback(
    (next: boolean) => {
      setIsDistrictOnState(next);

      // ✅ 지적편집도 켜질 때 로드뷰가 켜져 있으면 끄기
      if (next && roadviewVisible) {
        close();
      }
    },
    [roadviewVisible, close]
  );

  const handleSetRightOpen = useCallback(
    (expanded: boolean) => {
      setRightOpen(expanded);
      if (expanded) {
        // 오른쪽 토글이 열릴 때 필터검색 닫기 + 사이드바 닫기
        setFilterSearchOpen(false);
        if (useSidebar) setUseSidebar(false);
      }
    },
    [useSidebar, setUseSidebar]
  );

  const handleOpenFilterSearch = useCallback(() => {
    // 필터검색을 열 때 오른쪽 토글, 사이드바 둘 다 닫기
    setFilterSearchOpen(true);
    setRightOpen(false);
    setUseSidebar(false);
  }, [setUseSidebar]);

  const { siteReservations } = useSidebarCtx();

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

  const handleViewportChangeInternal = useCallback(
    (v: any) => {
      // 🔹 현재 뷰포트 중심과 마지막 검색 중심의 거리가 멀어졌을 때만 검색 임시핀 제거
      if (lastSearchCenterRef.current) {
        const centerLat = (v.leftTop.lat + v.rightBottom.lat) / 2;
        const centerLng = (v.leftTop.lng + v.rightBottom.lng) / 2;

        const d = distM(
          centerLat,
          centerLng,
          lastSearchCenterRef.current.lat,
          lastSearchCenterRef.current.lng
        );

        const THRESHOLD_M = 300; // 300m 이상 벗어나면 검색핀 제거
        if (d > THRESHOLD_M) {
          setLocalDraftMarkers((prev) =>
            prev.filter((m) => (m as any).source !== "search")
          );
          lastSearchCenterRef.current = null;
        }
      }

      onViewportChange?.(v);
    },
    [onViewportChange]
  );

  /* ===== 검색핸들러 ===== */
  const handleSubmitSearch = useCallback(
    (text: string) => {
      const query = text.trim();
      if (!query || !kakaoSDK || !mapInstance) return;

      // 상위 상태/검색 로직 호출 (핀 검색 + geocode + 메뉴)
      onSubmitSearch?.(query);

      const setCenterOnly = (lat: number, lng: number) => {
        mapInstance.setCenter(new kakaoSDK.maps.LatLng(lat, lng));
        mapInstance.setLevel(3);
      };

      const setCenterWithMarker = (
        lat: number,
        lng: number,
        label?: string | null
      ) => {
        // 1️⃣ 먼저 근처에 기존 마커가 있는지 확인 (매물/임시핀/예약핀 다 포함)
        const NEAR_THRESHOLD_M = 20; // 20m 안쪽이면 같은 위치로 본다

        const existing = visibleMarkers?.find((m) => {
          const pos = (m as any).position;
          if (!pos) return false;
          const d = distM(lat, lng, pos.lat, pos.lng);
          return d <= NEAR_THRESHOLD_M;
        });

        if (existing) {
          const pos = (existing as any).position;
          const title =
            (existing as any).title ?? label ?? query ?? "선택 위치";

          // 🔹 기준 중심/좌표를 기존 마커로 통일
          lastSearchCenterRef.current = { lat: pos.lat, lng: pos.lng };
          setCenterOnly(pos.lat, pos.lng);

          // 🔹 기존 마커 기준으로 메뉴만 열기 (새 임시핀 생성 X)
          onOpenMenu?.({
            position: { lat: pos.lat, lng: pos.lng },
            propertyTitle: title,
            pin: {
              kind: ((existing as any).kind ?? "question") as any,
              isFav: !!favById[String((existing as any).id)],
            },
          });

          return;
        }

        // 2️⃣ 근처에 기존 마커가 없으면, 검색용 임시핀(__search__) 생성
        lastSearchCenterRef.current = { lat, lng };
        setCenterOnly(lat, lng);

        const id = "__search__";

        upsertDraftMarker({
          id,
          lat,
          lng,
          address: label ?? query,
          source: "search",
          kind: "question",
        });

        // ⛔️ 더 이상 projection으로 좌표를 위로 올리지 않고
        //     핀 좌표 그대로 메뉴를 띄운다 (CSS에서 살짝 올려서 보이게 처리)
        onOpenMenu?.({
          position: { lat, lng },
          propertyTitle: label ?? query ?? "선택 위치",
          pin: { kind: "question", isFav: false },
        });
        onChangeHideLabelForId?.(id);
      };

      const places = new kakaoSDK.maps.services.Places();
      const geocoder = new kakaoSDK.maps.services.Geocoder();
      const Status = kakaoSDK.maps.services.Status;
      const centerLL = mapInstance.getCenter?.();

      const doAddressFallback = () => {
        geocoder.addressSearch(query, (addrRes: any[], addrStatus: string) => {
          if (addrStatus !== Status.OK || !addrRes?.length) return;
          const { x, y, road_address, address } = addrRes[0] ?? {};
          const lat = Number(y);
          const lng = Number(x);
          const label =
            road_address?.address_name ||
            address?.address_name ||
            query ||
            null;
          setCenterWithMarker(lat, lng, label);
        });
      };

      const { stationName, exitNo, hasExit } = parseStationAndExit(query);

      places.keywordSearch(
        query,
        (data: any[], status: string) => {
          if (status !== Status.OK || !data?.length) {
            doAddressFallback();
            return;
          }

          // 🚇 "신사역 3번 출구" 같이 출구까지 명시된 경우
          if (hasExit && stationName) {
            const station = pickBestStation(data, stationName);
            if (!station) {
              doAddressFallback();
              return;
            }

            const stationLL = new kakaoSDK.maps.LatLng(
              Number(station.y),
              Number(station.x)
            );

            places.keywordSearch(
              `${station.place_name} 출구`,
              (exitData: any[], exitStatus: string) => {
                if (exitStatus !== Status.OK || !exitData?.length) {
                  const lat = stationLL.getLat();
                  const lng = stationLL.getLng();
                  if (shouldCreateSearchPin(station, query)) {
                    setCenterWithMarker(lat, lng, station.place_name);
                  } else {
                    setCenterOnly(lat, lng);
                  }
                  return;
                }

                const picked =
                  pickBestExitStrict(
                    exitData,
                    stationName,
                    exitNo ?? null,
                    stationLL
                  ) ?? station;

                const lat = Number(picked.y);
                const lng = Number(picked.x);
                const label = picked.place_name ?? query;

                if (shouldCreateSearchPin(picked, query)) {
                  setCenterWithMarker(lat, lng, label);
                } else {
                  setCenterOnly(lat, lng);
                }
              },
              {
                location: stationLL,
                radius: 600,
              }
            );
            return;
          }

          // 일반 역/장소 검색
          let target: any;
          if (stationName) {
            target = pickBestStation(data, stationName);
          } else {
            target = pickBestPlace(data, query, centerLL ?? undefined);
          }

          if (!target) {
            doAddressFallback();
            return;
          }

          const lat = Number(target.y);
          const lng = Number(target.x);
          const label = target.place_name ?? query;

          if (shouldCreateSearchPin(target, query)) {
            setCenterWithMarker(lat, lng, label);
          } else {
            setCenterOnly(lat, lng);
          }
        },
        centerLL
          ? {
              location: centerLL,
              radius: 3000,
            }
          : undefined
      );
    },
    [
      kakaoSDK,
      mapInstance,
      onSubmitSearch,
      upsertDraftMarker,
      onOpenMenu,
      onChangeHideLabelForId,
      visibleMarkers,
      favById,
    ]
  );

  const handleDeleteFromView = useCallback(async () => {
    if (typeof onDeleteFromView === "function") {
      await onDeleteFromView();
      return;
    }
    const id =
      (selectedViewItem as any)?.id ?? (viewDataLocal as any)?.id ?? null;
    if (!id) return;

    try {
      await togglePinDisabled(String(id), true);
      await refreshViewportPins();
      setViewOpenLocal(false);
    } catch (e) {
      console.error("[disable-pin] 실패:", e);
    }
  }, [onDeleteFromView, selectedViewItem, viewDataLocal, refreshViewportPins]);

  const handleCloseView = useCallback(() => {
    setViewOpenLocal(false);
    closeView?.();
  }, [closeView]);

  const selectedViewForModal = useMemo(() => {
    const base = (selectedViewItem ??
      viewDataLocal ??
      null) as PropertyViewDetails | null;
    return ensureViewForEdit(base);
  }, [selectedViewItem, viewDataLocal]);

  /* 👇 메뉴 열릴 때 라벨 숨김 / 닫힐 때 복구 */
  useEffect(() => {
    if (!mapInstance || !menuAnchor) return;
    if (menuOpen) {
      hideLabelsAround(mapInstance, menuAnchor.lat, menuAnchor.lng, 40);
      return () => {
        showLabelsAround(mapInstance, menuAnchor.lat, menuAnchor.lng, 56);
      };
    } else {
      showLabelsAround(mapInstance, menuAnchor.lat, menuAnchor.lng, 56);
    }
  }, [mapInstance, menuOpen, menuAnchor?.lat, menuAnchor?.lng]);

  /* ✅ selectedViewItem이 생기면 모달을 연다 */
  useEffect(() => {
    if (selectedViewItem) setViewOpenLocal(true);
  }, [selectedViewItem]);

  /* 🔍 메뉴가 닫힐 때 검색 임시핀(__search__) 제거 */
  useEffect(() => {
    if (!menuOpen) {
      // 검색으로 생성된 임시핀만 제거 (source === "search")
      setLocalDraftMarkers((prev) =>
        prev.filter((m) => (m as any).source !== "search")
      );

      // 검색핀 때문에 숨겨둔 라벨 풀어주기
      if (hideLabelForId === "__search__") {
        onChangeHideLabelForId?.(undefined);
      }

      // 검색 기준 중심도 초기화
      lastSearchCenterRef.current = null;
    }
  }, [menuOpen, hideLabelForId, onChangeHideLabelForId]);

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
        /* onOpenMenu는 ContextMenuHost 타입에 없음 */
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

      {/* 오른쪽 상단 컨트롤 + 패널 영역 */}
      <div ref={rightAreaRef}>
        <TopRightControls
          activeMenu={activeMenu}
          onChangeFilter={(next) => {
            const resolved = next === activeMenu ? "all" : next;
            (onChangeFilter as any)(resolved);
          }}
          isDistrictOn={isDistrictOn}
          setIsDistrictOn={handleSetDistrictOn}
          poiKinds={poiKinds}
          onChangePoiKinds={onChangePoiKinds}
          roadviewVisible={roadviewVisible}
          onToggleRoadview={toggleRoadview}
          rightOpen={rightOpen}
          setRightOpen={handleSetRightOpen}
          sidebarOpen={useSidebar}
          setSidebarOpen={(open) => {
            setUseSidebar(open);
            if (open) {
              // 사이드바 열릴 때 오른쪽 토글/필터검색 둘 다 닫기
              setRightOpen(false);
              setFilterSearchOpen(false);
            }
          }}
          getBounds={getBoundsLLB}
          getLevel={() => mapInstance?.getLevel?.()}
          // 🔵 로드뷰 도로 버튼용 상태/토글 전달
          roadviewRoadOn={roadviewRoadOn}
          onToggleRoadviewRoad={() => setRoadviewRoadOn((prev) => !prev)}
        />
      </div>

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
          onToggleSidebar={() => {
            const next = !useSidebar;
            setUseSidebar(next);
            if (next) {
              // 사이드바가 열리는 순간 다른 두 개 닫기
              setRightOpen(false);
              setFilterSearchOpen(false);
            }
          }}
        />
      </div>

      <ModalsHost
        /* ✅ 모달 열림 여부는 로컬 뷰 상태 + 상위에서 내려온 createOpen */
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
        }}
        pinDraftId={
          createFromDraftId != null ? Number(createFromDraftId) : undefined
        }
        roadviewVisible={roadviewVisible}
        roadviewContainerRef={roadviewContainerRef}
        onCloseRoadview={close}
        createPinKind={createPinKind ?? null}
      />
    </div>
  );
}

export default MapHomeUI;
