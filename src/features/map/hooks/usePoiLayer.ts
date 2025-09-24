// src/features/map/hooks/usePoiLayer.ts  (Overlay ver. with center-bias & zoom-scaling)
"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  PoiKind,
  KAKAO_CATEGORY,
  createPoiOverlay,
  calcPoiSizeByLevel,
} from "../lib/poiOverlays";

export type UsePoiLayerOptions = {
  kakaoSDK?: any | null;
  map?: any | null;
  enabledKinds?: PoiKind[];
  maxResultsPerKind?: number;
  minViewportEdgeMeters?: number;
  showAtOrBelowLevel?: number;
};

const DEFAULTS = {
  maxResultsPerKind: 80,
  minViewportEdgeMeters: 1000,
  showAtOrBelowLevel: 6,
} as const;

const IDLE_THROTTLE_MS = 1200;

/* ───────── utils ───────── */
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
      resolve(acc);
    };
    places.categorySearch(categoryCode, handle, { bounds });
  });
}

/* ───────── hook (Overlay) ───────── */
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

  // key -> { destroy, update }
  const overlaysRef = useRef<
    Map<
      string,
      {
        destroy: () => void;
        update: (
          p: Partial<{
            lat: number;
            lng: number;
            zIndex: number;
            kind: PoiKind;
            size: number;
            iconSize: number;
          }>
        ) => void;
      }
    >
  >(new Map());

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

  const lastBoxRef = useRef<{
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null>(null);
  const reqSeqRef = useRef(0);
  const placesRef = useRef<any | null>(null);

  const runSearch = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!map || !kakao) return;

      // 확대/거리 게이트
      const lv = map.getLevel();
      const minEdge = getMinViewportEdgeMeters();
      const pass = lv <= showAtOrBelowLevel || minEdge <= minViewportEdgeMeters;

      if (!pass || enabledKinds.length === 0) {
        // 모두 제거
        for (const [, inst] of overlaysRef.current) inst.destroy();
        overlaysRef.current.clear();
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

      // 화면이 넓으면 더 잘게 긁어오기 + 중심 가까운 셀부터
      const shortEdgeM = getMinViewportEdgeMeters();
      const gridSize = shortEdgeM > 2500 ? 3 : shortEdgeM > 1400 ? 2 : 1;
      let cells =
        gridSize > 1
          ? splitBoundsToGrid(kakao, boundsObj, gridSize, gridSize)
          : [boundsObj];

      const center = map.getCenter();
      const cLat = center.getLat();
      const cLng = center.getLng();
      const cellCenter = (b: any) => {
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        return {
          lat: (sw.getLat() + ne.getLat()) / 2,
          lng: (sw.getLng() + ne.getLng()) / 2,
        };
      };
      cells.sort((a, b) => {
        const A = cellCenter(a),
          B = cellCenter(b);
        return (
          distM(A.lat, A.lng, cLat, cLng) - distM(B.lat, B.lng, cLat, cLng)
        );
      });

      const nextKeys = new Set<string>();

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
            Math.min(maxResultsPerKind * 2, 200)
          );
          acc = acc.concat(chunk);
        }

        // 중복 제거
        const dedup: any[] = [];
        const seenIds = new Set<string>();
        for (const p of acc) {
          const id = p.id ?? `${p.x},${p.y}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          dedup.push(p);
        }

        // 중심 가까운 순 정렬
        dedup.sort((a, b) => {
          const da = distM(Number(a.y), Number(a.x), cLat, cLng);
          const db = distM(Number(b.y), Number(b.x), cLat, cLng);
          return da - db;
        });

        // 상한 적용
        const pick = dedup.slice(0, maxResultsPerKind);

        // 현재 줌 레벨 기준 초기 크기
        const { size: initSize, iconSize: initIconSize } =
          calcPoiSizeByLevel(lv);

        for (const p of pick) {
          const x = Number(p.x);
          const y = Number(p.y);
          const id = p.id ?? `${x},${y}`;
          const key = `${kind}:${id}`;
          nextKeys.add(key);

          const ex = overlaysRef.current.get(key);
          if (ex) {
            ex.update({ lat: y, lng: x, zIndex: 3, kind });
          } else {
            const { destroy, update } = createPoiOverlay(
              kakao,
              map,
              { id: key, kind, lat: y, lng: x, zIndex: 3 },
              { size: initSize, iconSize: initIconSize }
            );
            overlaysRef.current.set(key, { destroy, update });
          }
        }
      }

      if (mySeq !== reqSeqRef.current) return;

      // remove stale
      for (const [key, inst] of overlaysRef.current.entries()) {
        if (!nextKeys.has(key)) {
          inst.destroy();
          overlaysRef.current.delete(key);
        }
      }
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
    runSearch({ force: true });
    return () => {
      kakao.maps.event.removeListener(map, "idle", handler);
      for (const [, inst] of overlaysRef.current) inst.destroy();
      overlaysRef.current.clear();
    };
  }, [map, kakao, throttled, runSearch]);

  // 줌 레벨이 바뀔 때마다 모든 오버레이 크기 갱신
  useEffect(() => {
    if (!map || !kakao) return;
    const applyZoomSize = () => {
      const lv = map.getLevel();
      const { size, iconSize } = calcPoiSizeByLevel(lv);
      for (const [, inst] of overlaysRef.current) {
        inst.update({ size, iconSize });
      }
    };
    applyZoomSize(); // 초기 1회
    const handler = () => applyZoomSize();
    kakao.maps.event.addListener(map, "zoom_changed", handler);
    return () => {
      kakao.maps.event.removeListener(map, "zoom_changed", handler);
    };
  }, [map, kakao]);

  // 종류 변경 시 즉시 리프레시
  useEffect(() => {
    for (const [, inst] of overlaysRef.current) inst.destroy();
    overlaysRef.current.clear();
    runSearch({ force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKinds.join(",")]);

  return {
    count: overlaysRef.current.size,
    refresh: () => runSearch({ force: true }),
    clear: () => {
      for (const [, inst] of overlaysRef.current) inst.destroy();
      overlaysRef.current.clear();
    },
  };
}

export default usePoiLayer;
