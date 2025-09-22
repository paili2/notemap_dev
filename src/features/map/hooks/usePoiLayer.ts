"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KAKAO_CATEGORY, POI_ICON, PoiKind } from "../lib/poiCategory";
import {
  upsertPoiMarker,
  reconcilePoiMarkers,
  clearMarkers,
  beginPoiFrame,
} from "../lib/poiMarkers";

export type UsePoiLayerOptions = {
  kakaoSDK?: any | null;
  map?: any | null;
  /** 표시할 POI 종류(버튼에서 토글) */
  enabledKinds?: PoiKind[];
  /** 각 종류별 최종 마커 상한 */
  maxResultsPerKind?: number;
  /** 화면의 '짧은 변' 길이가 이 값(미터) 이하일 때만 POI 표시. 1000m ≈ 좌/우 또는 상/하 500m 체감 */
  minViewportEdgeMeters?: number;
  /** 이 레벨 이하일 때 POI 표시 (숫자 작을수록 더 확대) */
  showAtOrBelowLevel?: number;
};

const DEFAULTS = {
  maxResultsPerKind: 80,
  minViewportEdgeMeters: 1000,
  showAtOrBelowLevel: 6,
} as const;

const IDLE_THROTTLE_MS = 1200;

/* ────────────────────────────── utils ────────────────────────────── */
function useThrottle(fn: (...a: any[]) => void, wait = IDLE_THROTTLE_MS) {
  const lastRef = useRef(0);
  const timer = useRef<any>(null);
  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      const remaining = wait - (now - lastRef.current);
      if (remaining <= 0) {
        lastRef.current = now;
        fn(...args);
      } else {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          lastRef.current = Date.now();
          fn(...args);
        }, remaining);
      }
    },
    [fn, wait]
  );
}

// Haversine 거리(m)
function distM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** bounds를 nx×ny 격자로 잘라 kakao.maps.LatLngBounds 배열로 반환 */
function splitBoundsToGrid(kakao: any, bounds: any, nx: number, ny: number) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const minLat = sw.getLat(),
    minLng = sw.getLng();
  const maxLat = ne.getLat(),
    maxLng = ne.getLng();

  const cells: any[] = [];
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      const aLat = minLat + ((maxLat - minLat) * ix) / nx;
      const bLat = minLat + ((maxLat - minLat) * (ix + 1)) / nx;
      const aLng = minLng + ((maxLng - minLng) * iy) / ny;
      const bLng = minLng + ((maxLng - minLng) * (iy + 1)) / ny;
      cells.push(
        new kakao.maps.LatLngBounds(
          new kakao.maps.LatLng(aLat, aLng),
          new kakao.maps.LatLng(bLat, bLng)
        )
      );
    }
  }
  return cells;
}

/** Kakao Places categorySearch의 모든 페이지(최대 3) 수집 */
async function searchCategoryAllPagesByBounds(
  kakao: any,
  places: any,
  categoryCode: string,
  bounds: any,
  hardLimit = 200
): Promise<any[]> {
  return new Promise((resolve) => {
    const acc: any[] = [];
    const handle = (data: any[], status: string, pagination: any) => {
      if (status === kakao.maps.services.Status.OK && Array.isArray(data)) {
        acc.push(...data);
        if (acc.length >= hardLimit) {
          resolve(acc.slice(0, hardLimit));
          return;
        }
        if (pagination && pagination.hasNextPage) {
          pagination.nextPage();
          return;
        }
      }
      resolve(acc); // NO_RESULT 또는 마지막 페이지
    };
    places.categorySearch(categoryCode, handle, { bounds });
  });
}

/* ────────────────────────────── hook ────────────────────────────── */
export function usePoiLayer({
  kakaoSDK,
  map,
  enabledKinds = [],
  maxResultsPerKind = DEFAULTS.maxResultsPerKind,
  minViewportEdgeMeters = DEFAULTS.minViewportEdgeMeters,
  showAtOrBelowLevel = DEFAULTS.showAtOrBelowLevel,
}: UsePoiLayerOptions) {
  const kakao =
    kakaoSDK ?? (typeof window !== "undefined" ? (window as any).kakao : null);

  const [markers, setMarkers] = useState<any[]>([]);
  const placesRef = useRef<any | null>(null);
  const reqSeqRef = useRef(0);
  const lastBoxRef = useRef<{
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null>(null);

  // helpers
  const getBoundsBox = useCallback(() => {
    if (!map || !kakao) return null;
    const b = map.getBounds();
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    return {
      sw: { lat: sw.getLat(), lng: sw.getLng() },
      ne: { lat: ne.getLat(), lng: ne.getLng() },
    };
  }, [map, kakao]);

  const getKakaoBounds = useCallback(() => {
    if (!map || !kakao) return null;
    return map.getBounds();
  }, [map, kakao]);

  const getMinViewportEdgeMeters = useCallback(() => {
    if (!map || !kakao) return Infinity;
    const b = map.getBounds();
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    const nwLat = ne.getLat();
    const nwLng = sw.getLng();
    const width = distM(nwLat, nwLng, ne.getLat(), ne.getLng());
    const height = distM(sw.getLat(), sw.getLng(), nwLat, nwLng);
    return Math.min(width, height);
  }, [map, kakao]);

  const movedEnough = useCallback((a: any, b: any) => {
    if (!b) return true;
    const d = (x: number, y: number) => Math.abs(x - y);
    return (
      d(a.sw.lat, b.sw.lat) > 0.002 ||
      d(a.sw.lng, b.sw.lng) > 0.002 ||
      d(a.ne.lat, b.ne.lat) > 0.002 ||
      d(a.ne.lng, b.ne.lng) > 0.002
    );
  }, []);

  const runSearch = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!map || !kakao) return;

      beginPoiFrame(); // 깜빡임 억제 프레임 시작

      // 확대/거리 게이트
      const lv = map.getLevel();
      const minEdge = getMinViewportEdgeMeters();
      const pass = lv <= showAtOrBelowLevel || minEdge <= minViewportEdgeMeters;

      if (!pass || enabledKinds.length === 0) {
        // 안 보여줄 조건이면 전부 숨김
        reconcilePoiMarkers(new Set(), { graceFrames: 0 });
        setMarkers((prev) => {
          clearMarkers(prev);
          return [];
        });
        return;
      }

      const bbox = getBoundsBox();
      if (!bbox) return;
      if (!opts?.force && !movedEnough(bbox, lastBoxRef.current)) return;
      lastBoxRef.current = bbox;

      const mySeq = ++reqSeqRef.current;

      if (!placesRef.current && kakao?.maps?.services?.Places) {
        placesRef.current = new kakao.maps.services.Places();
      }
      const boundsObj = getKakaoBounds();
      if (!boundsObj || !placesRef.current) return;

      // 화면이 넓으면 더 잘게(많이) 긁어오기
      const shortEdgeM = getMinViewportEdgeMeters();
      const gridSize = shortEdgeM > 2500 ? 3 : shortEdgeM > 1400 ? 2 : 1;
      const cells =
        gridSize > 1
          ? splitBoundsToGrid(kakao, boundsObj, gridSize, gridSize)
          : [boundsObj];

      const nextKeys = new Set<string>();
      const newMarkers: any[] = [];

      // 각 종류별로, 셀을 돌며 수집 → id 중복 제거 → 상한 적용
      for (const kind of enabledKinds) {
        const code = (KAKAO_CATEGORY as Record<PoiKind, string>)[kind];
        if (!code) continue;

        let acc: any[] = [];
        for (const cell of cells) {
          const chunk = await searchCategoryAllPagesByBounds(
            kakao,
            placesRef.current,
            code,
            cell,
            // 셀 당 하드 상한 (전체 상한보다 크게, 중복제거 후 최종 상한 적용)
            Math.min(maxResultsPerKind * 2, 200)
          );
          acc = acc.concat(chunk);
        }

        const seen = new Set<string>();
        for (const p of acc) {
          const x = Number(p.x);
          const y = Number(p.y);
          const id = p.id ?? `${x},${y}`;
          if (seen.has(id)) continue;
          seen.add(id);

          const key = `${kind}:${id}`;
          const m = upsertPoiMarker(
            kakao,
            map,
            key,
            x,
            y,
            p.place_name,
            (POI_ICON as any)[kind]
          );
          nextKeys.add(key);
          newMarkers.push(m);

          if (seen.size >= maxResultsPerKind) break;
        }
      }

      if (mySeq !== reqSeqRef.current) return;

      // 표시/숨김 정리
      reconcilePoiMarkers(nextKeys, { graceFrames: opts?.force ? 0 : 2 });
      setMarkers(newMarkers);
    },
    [
      map,
      kakao,
      enabledKinds,
      maxResultsPerKind,
      minViewportEdgeMeters,
      showAtOrBelowLevel,
      getMinViewportEdgeMeters,
      getBoundsBox,
      getKakaoBounds,
      movedEnough,
    ]
  );

  const throttled = useThrottle(runSearch);

  useEffect(() => {
    if (!map || !kakao) return;
    const handler = () => throttled();
    kakao.maps.event.addListener(map, "idle", handler);
    runSearch({ force: true }); // 최초 1회 강제
    return () => {
      kakao.maps.event.removeListener(map, "idle", handler);
      setMarkers((prev) => {
        clearMarkers(prev);
        return [];
      });
    };
  }, [map, kakao, throttled, runSearch]);

  // 종류 바뀌면 즉시 새로고침(기존 것 숨김)
  useEffect(() => {
    reconcilePoiMarkers(new Set(), { graceFrames: 0 });
    setMarkers((prev) => {
      clearMarkers(prev);
      return [];
    });
    runSearch({ force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKinds.join(",")]);

  return {
    markers,
    refresh: () => runSearch({ force: true }),
    clear: () => clearMarkers(markers),
  };
}

// 기본/이름 둘 다 export (import 방식 혼선을 방지)
export default usePoiLayer;
