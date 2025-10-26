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
  const n3 = name.match(/[①②③④⑤⑥⑦⑧⑨⑩]/);
  if (n1) return Number(n1[1]);
  if (n2) return Number(n2[1]);
  if (n3) return "①②③④⑤⑥⑦⑧⑨⑩".indexOf(n3[0]) + 1;
  return null;
}

// 출구 선별(강화)
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

    let dist = Number(d.distance ?? 999999);
    if (isNaN(dist) && stationLL) {
      const dy = Math.abs(Number(d.y) - stationLL.getLat());
      const dx = Math.abs(Number(d.x) - stationLL.getLng());
      dist = Math.sqrt(dx * dx + dy * dy) * 111000;
    }
    score += Math.max(0, 500 - Math.min(dist, 500));
    return { d, score, dist };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.d ?? data[0];
}

/* ------ 일반 장소(학교 가중) ------ */
function scorePlaceForSchool(item: any, keywordNorm: string) {
  const nameN = norm(item.place_name);
  const cat = (item.category_name || "").replace(/\s+/g, "");
  let s = 0;

  // 정확/시작 일치 가중
  if (nameN === keywordNorm) s += 1000;
  if (nameN.startsWith(keywordNorm)) s += 400;
  if (nameN.includes(keywordNorm)) s += 150;

  // 학교/캠퍼스 가중
  if (/학교|대학교|캠퍼스|정문|본관/.test(item.place_name)) s += 300;
  if (/학교|대학교/.test(cat)) s += 250;

  // 잡음(숲/등산/로/길/야외) 페널티
  if (/숲|산|등산|둘레길|산책로|야외|야영/.test(item.place_name)) s -= 500;
  if (/[로|길]$/.test(item.place_name)) s -= 300;

  // 위치 가중(카카오가 주는 distance m)
  const dist = Number(item.distance ?? 999999);
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

  // 일반 스텝: 정확 → 부분 → 거리
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

// 학교 쿼리 감지
const isSchoolQuery = (q: string) =>
  /(대학교|대학|초등학교|중학교|고등학교|캠퍼스)/.test(q);

// 중복 제거용
const uniqById = (arr: any[]) => {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const it of arr || []) {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
};

// 학교 전용 스코어러 (카테·키워드 가중↑, 야외/도로 페널티↓↓)
function scorePlaceForSchoolHard(item: any, keywordNorm: string) {
  const name = item.place_name || "";
  const nameN = norm(name);
  const catName = (item.category_name || "").replace(/\s+/g, "");
  const group = item.category_group_code || "";

  let s = 0;

  // 이름 일치도
  if (nameN === keywordNorm) s += 1200;
  if (nameN.startsWith(keywordNorm)) s += 500;
  if (nameN.includes(keywordNorm)) s += 180;

  // 학교/캠퍼스 가중
  if (/학교|대학교|캠퍼스/.test(name)) s += 450;
  if (/정문|본관/.test(name)) s += 220;
  if (/학교|대학교/.test(catName)) s += 320;

  // 카테고리 그룹 가중 (SC4 = 학교)
  if (group === "SC4") s += 800;

  // 노이즈 큰 페널티
  if (/숲|산|둘레길|산책로|야외/.test(name)) s -= 800;
  if (/주차장/.test(name)) s -= 500;
  if (/버스정류장|정류장/.test(name)) s -= 400;
  if (/[로|길]$/.test(name)) s -= 350;

  // 거리 가중(최대 +400)
  const dist = Number(item.distance ?? 999999);
  if (!isNaN(dist)) s += Math.max(0, 400 - Math.min(dist, 400));

  return s;
}

/* ----------------------------------------------------------- */

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

  const [localDraftMarkers, setLocalDraftMarkers] = useState<MapMarker[]>([]);
  const [filterParams, setFilterParams] = useState<PinSearchParams | null>(
    null
  );
  const [searchRes, setSearchRes] = useState<PinSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
        draftState: (d as any).draftState,
      })),
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
  const clearLocalDrafts = useCallback(() => setLocalDrafts([]), []);
  function setLocalDrafts(v: MapMarker[] | ((p: MapMarker[]) => MapMarker[])) {
    setLocalDraftMarkers(v as any);
  }

  const handleAfterCreate = useCallback(
    (args: {
      pinId: string;
      matchedDraftId?: string | number | null;
      lat: number;
      lng: number;
    }) => {
      const { pinId, matchedDraftId, lat, lng } = args;
      if (matchedDraftId != null) replaceTempByRealId(matchedDraftId, pinId);
      else
        upsertDraftMarker({
          id: `__visit__${pinId}`,
          lat,
          lng,
          address: null,
          source: "draft",
        });
    },
    [replaceTempByRealId, upsertDraftMarker]
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

  const normServerPoints = useMemo(
    () => serverPoints?.map((p) => ({ ...p, title: p.title ?? undefined })),
    [serverPoints]
  );
  const normServerDrafts = useMemo(
    () => serverDrafts?.map((d) => ({ ...d, title: d.title ?? undefined })),
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

  const { plannedDrafts, plannedMarkersOnly } = usePlannedDrafts({
    filter,
    getBounds: getBoundsRaw,
  });

  const {
    roadviewContainerRef,
    visible: roadviewVisible,
    openAtCenter,
    openAt,
    close,
  } = useRoadview({ kakaoSDK, map: mapInstance, autoSync: true });

  const toggleRoadview = useCallback(() => {
    if (roadviewVisible) {
      close();
      return;
    }
    // ✅ 우선순위: 선택 좌표 → 메뉴앵커 → 드래프트 → 지도중심
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
      console.log("[rv-toggle] openAt", anchor);
      openAt(anchor, { face: anchor }); // ✅ 탐색/고정은 pos, 시선은 face
    } else {
      console.log("[rv-toggle] openAtCenter (fallback)");
      openAtCenter();
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
  ]);

  const mapViewRef = useRef<MapViewHandle>(null);
  const [didInit, setDidInit] = useState(false);
  const handleMapReady = useCallback(
    (api: unknown) => {
      onMapReady?.(api);
      requestAnimationFrame(() => setDidInit(true));
    },
    [onMapReady]
  );

  const activeMenu = (filter as MapMenuKey) ?? "all";
  const visibleMarkers = useMemo(() => {
    if (activeMenu === "plannedOnly") return plannedMarkersOnly;
    return mergedWithTempDraft;
  }, [activeMenu, plannedMarkersOnly, mergedWithTempDraft]);

  const [rightOpen, setRightOpen] = useState(false);
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);
  const [isDistrictOn, setIsDistrictOn] = useState(false);

  const { siteReservations } = useSidebarCtx();

  const refreshViewportPins = useCallback(
    async (_box?: any) => {
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

  // ===== 검색핸들러 =====
  const handleSubmitSearch = useCallback(
    (text: string) => {
      const query = text.trim();
      if (!query || !kakaoSDK || !mapInstance) return;

      onSubmitSearch?.(query);

      // 지도만 이동
      const setCenterOnly = (lat: number, lng: number) => {
        mapInstance.setCenter(new kakaoSDK.maps.LatLng(lat, lng));
        mapInstance.setLevel(3);
      };

      // 주소처럼 보이면 지오코딩
      const looksLikeAddress =
        /(\d|\b동\b|\b구\b|\b로\b|\b길\b|\b번지\b|\b리\b)/.test(query);
      if (looksLikeAddress) {
        const geocoder = new kakaoSDK.maps.services.Geocoder();
        geocoder.addressSearch(query, (res: any[], status: string) => {
          if (status !== kakaoSDK.maps.services.Status.OK || !res?.[0]) return;
          setCenterOnly(+res[0].y, +res[0].x);
        });
        return;
      }

      const places = new kakaoSDK.maps.services.Places();
      const biasCenter = mapInstance.getCenter?.();
      const biasOpt: any = biasCenter
        ? {
            location: biasCenter,
            radius: 20000,
            sort: kakaoSDK.maps.services.SortBy.DISTANCE,
          }
        : {};

      // 역/출구 분기
      const isStationQuery = /역|출구/.test(query);
      if (!isStationQuery) {
        // ===== 일반 장소 =====
        const isSchoolQuery =
          /(대학교|대학|초등학교|중학교|고등학교|캠퍼스)/.test(query);

        places.keywordSearch(
          query,
          (res: any[], status: string) => {
            if (status !== kakaoSDK.maps.services.Status.OK || !res?.length)
              return;

            if (isSchoolQuery) {
              const kwN = norm(query);
              const ranked = res
                .map((d) => ({ d, s: scorePlaceForSchool(d, kwN) }))
                .sort((a, b) => b.s - a.s);
              const best = ranked[0]?.d ?? res[0];
              setCenterOnly(Number(best.y), Number(best.x));
              return;
            }

            const best = pickBestPlace(res, query, biasCenter);
            setCenterOnly(Number(best.y), Number(best.x));
          },
          biasOpt
        );
        return;
      }

      // ===== 역/출구 =====
      const { stationName, hasExit, exitNo, raw } = parseStationAndExit(query);
      const stationKeyword = (stationName ? `${stationName}역` : raw).trim();
      const koreaRect = "124.0,33.0,132.0,39.0" as const;

      places.categorySearch(
        "SW8",
        (catRes: any[], catStatus: string) => {
          const exact =
            catStatus === kakaoSDK.maps.services.Status.OK
              ? catRes.find(
                  (d) =>
                    d.place_name.replace(/\s+/g, "") ===
                    stationKeyword.replace(/\s+/g, "")
                )
              : null;

          const afterStationFound = (st: any) => {
            const sLat = +st.y;
            const sLng = +st.x;
            const stationLL = new kakaoSDK.maps.LatLng(sLat, sLng);

            if (hasExit) {
              const queries = [
                `${stationName}역 ${exitNo}번 출구`,
                `${stationName}역 ${exitNo}번출구`,
                `${stationName} ${exitNo}번 출구`,
                `${exitNo}번 출구 ${stationName}역`,
              ];
              const opts = {
                location: stationLL,
                radius: 350,
                sort: kakaoSDK.maps.services.SortBy.DISTANCE,
              } as const;

              const doneOnce = new Set<string>();
              let acc: any[] = [];
              const run = (i = 0) => {
                if (i >= queries.length) {
                  if (!acc.length) return setCenterOnly(sLat, sLng);
                  const best = pickBestExitStrict(
                    acc,
                    stationName,
                    exitNo,
                    stationLL
                  );
                  const MAX_EXIT_DIST = 300;
                  const dist = Number(best?.distance ?? Infinity);
                  if (!isNaN(dist) && dist > MAX_EXIT_DIST)
                    return setCenterOnly(sLat, sLng);
                  return setCenterOnly(Number(best.y), Number(best.x));
                }
                places.keywordSearch(
                  queries[i],
                  (exRes: any[], exStatus: string) => {
                    if (
                      exStatus === kakaoSDK.maps.services.Status.OK &&
                      exRes?.length
                    ) {
                      for (const r of exRes) {
                        if (!doneOnce.has(r.id)) {
                          doneOnce.add(r.id);
                          acc.push(r);
                        }
                      }
                    }
                    run(i + 1);
                  },
                  opts
                );
              };
              run();
              return;
            }

            const display =
              stationName || String(st.place_name).replace(/역$/, "");
            places.keywordSearch(
              `${display}역 출구`,
              (exRes: any[], exStatus: string) => {
                if (
                  exStatus === kakaoSDK.maps.services.Status.OK &&
                  exRes?.length
                ) {
                  const bestExit = pickBestExitStrict(
                    exRes,
                    stationName || display,
                    null,
                    stationLL
                  );
                  const MAX_EXIT_DIST = 300;
                  const dist = Number(bestExit?.distance ?? Infinity);
                  if (!isNaN(dist) && dist > MAX_EXIT_DIST)
                    return setCenterOnly(sLat, sLng);
                  return setCenterOnly(+bestExit.y, +bestExit.x);
                }
                return setCenterOnly(sLat, sLng);
              },
              { location: stationLL, radius: 600 }
            );
          };

          if (exact) return afterStationFound(exact);

          places.keywordSearch(
            stationKeyword,
            (stRes: any[], stStatus: string) => {
              if (
                stStatus !== kakaoSDK.maps.services.Status.OK ||
                !stRes?.length
              )
                return;
              const bestStation = pickBestStation(
                stRes,
                stationKeyword.replace(/역$/, "")
              );
              afterStationFound(bestStation);
            },
            { rect: koreaRect }
          );
        },
        { rect: koreaRect }
      );
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
        pinsLoading={pinsLoading || searchLoading}
        pinsError={pinsError || searchError}
        menuOpen={menuOpen}
        menuAnchor={menuAnchor}
        hideLabelForId={hideLabelForId}
        onMarkerClick={onMarkerClick}
        onOpenMenu={onOpenMenu}
        onChangeHideLabelForId={onChangeHideLabelForId}
        onMapReady={(api) => {
          onMapReady?.(api);
          requestAnimationFrame(() => setDidInit(true));
        }}
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
        onClear={clearSearch}
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
        createHostHandlers={{
          ...createHostHandlers,
          onAfterCreate: handleAfterCreate,
        }}
        roadviewVisible={roadviewVisible}
        roadviewContainerRef={roadviewContainerRef}
        onCloseRoadview={close}
      />
    </div>
  );
}

export default MapHomeUI;
