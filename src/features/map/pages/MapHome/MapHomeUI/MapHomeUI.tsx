"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { FilterSearch } from "../../../components/filterSearch";

import { useSidebar as useSidebarCtx, Sidebar } from "@/features/sidebar";
import { MapHomeUIProps } from "./types";
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
import type { MapMarker } from "../../../shared/types/map";
import type { PinKind } from "@/features/pins/types";
import type {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { searchPins, togglePinDisabled } from "@/shared/api/pins";

/* ✅ 사이드바 아이템 타입 import 추가 */
import type { ListItem, SubListItem } from "@/features/sidebar/types/sidebar";

/* ✅ 상세보기 데이터 패칭 & 뷰모델 변환 */
import { getPinRaw } from "@/shared/api/getPin";
import { toViewDetailsFromApi } from "@/features/properties/lib/view/toViewDetailsFromApi";

/* 라벨 숨김/복원 */
import {
  hideLabelsAround,
  showLabelsAround,
} from "@/features/map/shared/overlays/labelRegistry";

import { distM } from "@/features/map/hooks/poi/geometry";
import { useRoadview } from "@/features/map/hooks/useRoadview";
import { usePinsFromViewport } from "@/features/map/hooks/usePinsFromViewport";
import { MapMenuKey } from "@/features/map/components/top/components/types/types";
import { PropertyViewDetails } from "@/features/properties/components/modals/PropertyViewModal/types";

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
  const addr =
    item.road_address_name ||
    item.address_name ||
    item.address?.address_name ||
    "";
  const name = item.place_name || addr || keyword;

  // 1) "대한민국", "○○시청/구청/도청" 같은 큰 단위는 **무조건 핀 없이 이동만**
  const bigRegionPattern = /(대한민국|청사|도청|시청|구청)$/;
  if (bigRegionPattern.test(name) || bigRegionPattern.test(addr)) {
    return false;
  }

  // 2) "○○시" 단독(동/읍/면/리 없이)만 검색된 경우도 핀 없이 이동만
  if (/^(.*(시|군|구))$/.test(name) && !/(동|읍|면|리)/.test(name)) {
    return false;
  }

  // 3) 그 밖의 카테고리 있는 애들(편의시설, 아파트 등)은 핀 생성 허용
  if (item.category_group_code) return true;

  // 4) 나머지(동 단위 주소, 상가 이름 등)는 핀 허용
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

  console.debug("[MapHomeUI] draftHeaderPrefill prop =", draftHeaderPrefill);

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

      const raw = (apiPin as any)?.data ?? apiPin;
      const base = toViewDetailsFromApi(raw) as PropertyViewDetails;

      const withEditInitial = {
        ...base,
        id: (base as any).id ?? pinId,
        editInitial: {
          view: { ...base },
          raw,
        },
      } as PropertyViewDetails & { editInitial: any };

      setViewDataLocal(withEditInitial);
    } catch (e) {
      console.error(e);
      setViewOpenLocal(false);
    }
  }, []);

  const handleViewFromMenu = useCallback(
    (id: string) => {
      if (typeof onViewFromMenu === "function") {
        onViewFromMenu(id);
      }
      handleViewFromMenuLocal(id);
    },
    [onViewFromMenu, handleViewFromMenuLocal]
  );

  const handleOpenViewAfterCreate = useCallback(
    (pinId: string | number) => {
      handleViewFromMenu(String(pinId));
    },
    [handleViewFromMenu]
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
        const displayName = (p.name ?? "").trim();

        return {
          id: String(p.id),
          name: displayName,
          title: displayName,
          lat: p.lat,
          lng: p.lng,
          badge: p.badge ?? null,

          /** ⭐ 신축/구옥 정보 그대로 전달 */
          ageType: p.ageType ?? null,
        };
      }),
    []
  );

  const toServerDraftsFromDrafts = useCallback(
    (drafts: NonNullable<PinSearchResult["drafts"]>) =>
      drafts.map((d) => {
        const label = (d.title ?? "답사예정").trim();

        return {
          id: d.id,
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

  const originalOnAfterCreate = createHostHandlers?.onAfterCreate;

  const handleAfterCreate = useCallback(
    (args: any) => {
      const { matchedDraftId, lat, lng, mode, pinId } = args || {};

      if (mode === "visit-plan-only") {
        createHostHandlers?.resetAfterCreate?.();
        createHostHandlers?.onClose?.();
        closeView?.();
        originalOnAfterCreate?.(args);
        return;
      }

      if (matchedDraftId != null && pinId != null) {
        replaceTempByRealId(matchedDraftId, pinId);
      } else if (lat != null && lng != null && pinId != null) {
        upsertDraftMarker({
          id: `__visit__${pinId}`,
          lat,
          lng,
          address: null,
          source: "draft",
        });
      }

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

  useEffect(() => {
    // 서버에서 핀이 안 들어온 상태면 굳이 손댈 필요 없음
    if (!effectiveServerPoints?.length && !effectiveServerDrafts?.length) {
      return;
    }

    const NEAR_THRESHOLD_M = 30; // 근처 판정 거리 (대략 30m)

    setLocalDraftMarkers((prev) => {
      if (!prev.length) return prev;

      let changed = false;

      const next = prev.filter((m) => {
        const src = (m as any).source;
        // 검색으로 생긴 임시핀만 대상
        if (src !== "search") return true;

        const pos = (m as any).position;
        if (!pos || pos.lat == null || pos.lng == null) return false;

        const lat = pos.lat;
        const lng = pos.lng;

        const hasRealPoint = effectiveServerPoints?.some((p) => {
          return distM(lat, lng, p.lat, p.lng) <= NEAR_THRESHOLD_M;
        });

        const hasRealDraft = effectiveServerDrafts?.some((d) => {
          return distM(lat, lng, d.lat, d.lng) <= NEAR_THRESHOLD_M;
        });

        // 근처에 실제 핀/드래프트가 있으면 이 search 임시핀은 제거
        if (hasRealPoint || hasRealDraft) {
          changed = true;
          return false;
        }
        return true;
      });

      return changed ? next : prev;
    });
  }, [effectiveServerPoints, effectiveServerDrafts]);

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

  const [isDistrictOn, setIsDistrictOnState] = useState(false);

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

  const [roadviewRoadOn, setRoadviewRoadOn] = useState(false);

  const rightAreaRef = useRef<HTMLDivElement | null>(null);
  const filterAreaRef = useRef<HTMLDivElement | null>(null);
  const sidebarAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rightOpen && !filterSearchOpen && !useSidebar) return;

      const target = event.target as Node | null;
      if (!target) return;

      const filterPortalRoot = document.getElementById("filter-search-root");
      if (filterPortalRoot && filterPortalRoot.contains(target)) {
        return;
      }

      if (
        rightAreaRef.current?.contains(target) ||
        filterAreaRef.current?.contains(target) ||
        sidebarAreaRef.current?.contains(target)
      ) {
        return;
      }

      setRightOpen(false);
      setFilterSearchOpen(false);
      setUseSidebar(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [rightOpen, filterSearchOpen, useSidebar, setUseSidebar]);

  const handleSetDistrictOn = useCallback(
    (next: boolean) => {
      setIsDistrictOnState(next);
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
        setFilterSearchOpen(false);
        if (useSidebar) setUseSidebar(false);
      }
    },
    [useSidebar, setUseSidebar]
  );

  const handleOpenFilterSearch = useCallback(() => {
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

  // 한 군데에서만 레벨 관리
  const TARGET_FOCUS_LEVEL = 4;

  // ✅ 답사지 예약(Flat 리스트) 클릭 시 지도 이동
  const handleFocusItemMap = useCallback(
    (item: ListItem | null) => {
      if (!item || !kakaoSDK || !mapInstance) return;
      if ((item as any).lat == null || (item as any).lng == null) return;

      const ll = new kakaoSDK.maps.LatLng((item as any).lat, (item as any).lng);

      try {
        const current = mapInstance.getLevel?.();

        if (typeof current === "number" && current !== TARGET_FOCUS_LEVEL) {
          mapInstance.setLevel(TARGET_FOCUS_LEVEL, { animate: true });
        }

        mapInstance.panTo(ll);
      } catch (e) {
        console.error("[handleFocusItemMap] map 이동 실패:", e);
      }
    },
    [kakaoSDK, mapInstance]
  );

  // ✅ 즐겨찾기 하위 매물 클릭 시 지도 이동
  const handleFocusSubItemMap = useCallback(
    (sub: SubListItem | null) => {
      if (!sub || !kakaoSDK || !mapInstance) return;
      if ((sub as any).lat == null || (sub as any).lng == null) return;

      const ll = new kakaoSDK.maps.LatLng((sub as any).lat, (sub as any).lng);

      try {
        const current = mapInstance.getLevel?.();

        if (typeof current === "number" && current !== TARGET_FOCUS_LEVEL) {
          mapInstance.setLevel(TARGET_FOCUS_LEVEL, { animate: true });
        }
        mapInstance.panTo(ll);
      } catch (e) {
        console.error("[handleFocusSubItemMap] map 이동 실패:", e);
      }
    },
    [kakaoSDK, mapInstance]
  );

  const handleViewportChangeInternal = useCallback(
    (v: any) => {
      if (lastSearchCenterRef.current) {
        const centerLat = (v.leftTop.lat + v.rightBottom.lat) / 2;
        const centerLng = (v.leftTop.lng + v.rightBottom.lng) / 2;

        const d = distM(
          centerLat,
          centerLng,
          lastSearchCenterRef.current.lat,
          lastSearchCenterRef.current.lng
        );

        const THRESHOLD_M = 300;
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

  const handleSubmitSearch = useCallback(
    (text: string) => {
      const query = text.trim();
      const isCityHallQuery = /(시청|구청|도청)\s*$/.test(
        query.replace(/\s+/g, "")
      );
      if (!query || !kakaoSDK || !mapInstance) return;

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
        // 시청/구청/도청은 건물이 커서 약간 어긋나도 잡히게 threshold 좀 넉넉히
        const NEAR_THRESHOLD_M = 80;

        // 1️⃣ 먼저 "실제 매물핀/답사예정 draft" 가 근처에 있는지부터 찾기
        const existing = visibleMarkers?.find((m) => {
          const idStr = String((m as any).id ?? "");

          // ⛔ 진짜로 제외해야 할 건 "__draft__", "__search__" 뿐
          if (idStr === "__draft__" || idStr === "__search__") return false;
          // "__visit__41" 같은 답사예정 핀은 여기서 통과시킨다

          const pos = (m as any).position;
          if (!pos) return false;

          const d = distM(lat, lng, pos.lat, pos.lng);
          return d <= NEAR_THRESHOLD_M;
        });

        if (existing) {
          // ✅ 근처에 실제 핀/답사예정 draft가 있으면, 그걸 기준으로만 메뉴 열기
          const pos = (existing as any).position;
          const title =
            (existing as any).title ?? label ?? query ?? "선택 위치";

          lastSearchCenterRef.current = { lat: pos.lat, lng: pos.lng };
          setCenterOnly(pos.lat, pos.lng);

          onOpenMenu?.({
            position: { lat: pos.lat, lng: pos.lng },
            propertyId: String((existing as any).id),
            propertyTitle: title,
            // pin: 생략해도 됨 (기존 핀으로 인식)
          });

          return;
        }

        // 2️⃣ 기존 핀이 없고, 검색어가 시청/구청/도청 계열이면
        //    👉 카메라만 이동시키고, ❌ 임시핀은 만들지 않는다
        if (isCityHallQuery) {
          lastSearchCenterRef.current = { lat, lng };
          setCenterOnly(lat, lng);
          return;
        }

        // 3️⃣ 그 밖의 일반 검색어만 __search__ 임시핀 생성
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

          // ✅ fallback 도 shouldCreateSearchPin 규칙을 같이 쓰도록
          const pseudoItem = {
            place_name: query,
            road_address_name: label,
            address_name: label,
            address: { address_name: label },
            category_group_code: "", // 공공기관 코드 없어도 상관없음
          };

          if (shouldCreateSearchPin(pseudoItem, query)) {
            // → 일반 장소/아파트 등: 검색핀 + 메뉴
            setCenterWithMarker(lat, lng, label);
          } else {
            // → 시청/구청/도청/○○시 단독 등: 이동만, 물음표핀 X
            setCenterOnly(lat, lng);
          }
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
    const base = (viewDataLocal ??
      selectedViewItem ??
      null) as PropertyViewDetails | null;
    return ensureViewForEdit(base);
  }, [selectedViewItem, viewDataLocal]);

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

  useEffect(() => {
    if (selectedViewItem) setViewOpenLocal(true);
  }, [selectedViewItem]);

  useEffect(() => {
    if (!menuOpen) {
      setLocalDraftMarkers((prev) =>
        prev.filter((m) => (m as any).source !== "search")
      );

      if (hideLabelForId === "__search__") {
        onChangeHideLabelForId?.(undefined);
      }

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
      <div
        className={cn(
          "pointer-events-none absolute left-3 right-3 top-3 z-[70]",
          "flex flex-col gap-2"
        )}
        role="region"
        aria-label="지도 상단 검색 및 토글"
      >
        <div className="pointer-events-auto w-full md:w-auto">
          <SearchForm
            value={q}
            onChange={onChangeQ}
            onSubmit={handleSubmitSearch}
            placeholder="장소, 주소, 버스 검색"
            className="w-full md:max-w-[360px]"
          />
        </div>

        <div className="pointer-events-auto flex items-center justify-between">
          <div
            ref={rightAreaRef}
            className="flex flex-col md:flex-row items-center gap-2"
          >
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
                  setRightOpen(false);
                  setFilterSearchOpen(false);
                }
              }}
              getBounds={getBoundsLLB}
              getLevel={() => mapInstance?.getLevel?.()}
              roadviewRoadOn={roadviewRoadOn}
              onToggleRoadviewRoad={() => setRoadviewRoadOn((prev) => !prev)}
            />
          </div>
        </div>
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
              setRightOpen(false);
              setFilterSearchOpen(false);
            }
          }}
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
    </div>
  );
}

export default MapHomeUI;
