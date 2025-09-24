// (Overlay ver. with center-bias & zoom-scaling & scalebar gate)
"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  PoiKind,
  KAKAO_CATEGORY,
  KAKAO_KEYWORD,
  createPoiOverlay,
  calcPoiSizeByLevel,
} from "../lib/poiOverlays";

export type UsePoiLayerOptions = {
  kakaoSDK?: any | null;
  map?: any | null;
  enabledKinds?: PoiKind[];
  maxResultsPerKind?: number;
  minViewportEdgeMeters?: number; // 시그니처 호환용(미사용)
  showAtOrBelowLevel?: number; // 시그니처 호환용(미사용)
};

const DEFAULTS = {
  maxResultsPerKind: 80,
  minViewportEdgeMeters: 250,
  showAtOrBelowLevel: 999,
} as const;

const IDLE_THROTTLE_MS = 500;

// 스케일바 픽셀 길이(대개 ~100px) & 원하는 스케일바 미터 임계값
const SCALEBAR_PX = 100;
const DESIRED_SCALEBAR_M = 400;

// 중심 근처 우선 채우기 설정
const NEAR_RATIO = 0.6;
const RADIUS_BY_KIND: Record<PoiKind, number> = {
  convenience: 800,
  cafe: 800,
  pharmacy: 1000,
  subway: 1500,
  bus: 1200,
};

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
  const dLng = toRad(lat2 === lat1 && lng2 === lng1 ? 0 : lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pickNearFar(
  list: any[],
  centerLat: number,
  centerLng: number,
  radiusM: number,
  maxCount: number,
  nearRatio: number
) {
  const near: Array<{ p: any; d: number }> = [];
  const far: Array<{ p: any; d: number }> = [];
  for (const p of list) {
    const d = distM(Number(p.y), Number(p.x), centerLat, centerLng);
    (d <= radiusM ? near : far).push({ p, d });
  }
  near.sort((a, b) => a.d - b.d);
  far.sort((a, b) => a.d - b.d);

  const nearTarget = Math.min(Math.round(maxCount * nearRatio), near.length);
  return [
    ...near.slice(0, nearTarget).map((x) => x.p),
    ...far.slice(0, maxCount - nearTarget).map((x) => x.p),
  ];
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

// 여러 키워드 지원 + bounds 우선, 실패 시 x/y/radius 폴백
async function searchKeywordAllPagesByBounds(
  kakao: any,
  places: any,
  keyword: string | string[],
  bounds: any,
  hardLimit = 200
): Promise<any[]> {
  const keywords = Array.isArray(keyword) ? keyword : [keyword];

  // bounds 중심/반경(폴백용) 계산
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const cLat = (sw.getLat() + ne.getLat()) / 2;
  const cLng = (sw.getLng() + ne.getLng()) / 2;

  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const distM = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  const widthM = distM(ne.getLat(), sw.getLng(), ne.getLat(), ne.getLng());
  const heightM = distM(sw.getLat(), sw.getLng(), ne.getLat(), sw.getLng());
  const radiusM = Math.min(
    20000,
    Math.max(100, Math.ceil(Math.max(widthM, heightM) / 2))
  );

  const runOneKeyword = (kw: string) =>
    new Promise<any[]>((resolve) => {
      const acc: any[] = [];

      const finish = () => resolve(acc.slice(0, hardLimit));

      // 1) bounds 기반 검색
      const handleBounds = (data: any[], status: string, pagination: any) => {
        if (status === kakao.maps.services.Status.OK && Array.isArray(data)) {
          acc.push(...data);
          if (acc.length >= hardLimit) return finish();
          if (pagination && pagination.hasNextPage)
            return pagination.nextPage();
        }
        // 2) 결과가 부족하면 x/y/radius 폴백
        const handleXY = (data2: any[], status2: string, pagination2: any) => {
          if (
            status2 === kakao.maps.services.Status.OK &&
            Array.isArray(data2)
          ) {
            acc.push(...data2);
            if (acc.length >= hardLimit) return finish();
            if (pagination2 && pagination2.hasNextPage)
              return pagination2.nextPage();
          }
          finish();
        };
        places.keywordSearch(kw, handleXY, {
          x: cLng,
          y: cLat,
          radius: radiusM,
        });
      };

      places.keywordSearch(kw, handleBounds, { bounds });
    });

  // 여러 키워드 순차 시도 후 dedup
  const all: any[] = [];
  for (const kw of keywords) {
    const chunk = await runOneKeyword(kw);
    all.push(...chunk);
    if (all.length >= hardLimit) break;
  }

  const seen = new Set<string>();
  const uniq: any[] = [];
  for (const p of all) {
    const id = p.id ?? `${p.x},${p.y}`;
    if (seen.has(id)) continue;
    seen.add(id);
    uniq.push(p);
    if (uniq.length >= hardLimit) break;
  }
  return uniq;
}

/* ───────── hook (Overlay) ───────── */
export function usePoiLayer({
  kakaoSDK,
  map,
  enabledKinds = [],
  maxResultsPerKind = DEFAULTS.maxResultsPerKind,
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

      // 현재 레벨(아이콘 크기 계산용)
      const lv = map.getLevel();

      // 스케일바 기준 표시 게이트
      const minEdgeM = getMinViewportEdgeMeters();
      const node: any =
        (map as any).getNode?.() ||
        (map as any).getContainer?.() ||
        (map as any).getDiv?.() ||
        null;
      const minEdgePx = Math.min(
        node?.clientWidth ??
          (typeof window !== "undefined" ? window.innerWidth : 0),
        node?.clientHeight ??
          (typeof window !== "undefined" ? window.innerHeight : 0)
      );
      const currentScaleBarM =
        (minEdgeM / Math.max(1, minEdgePx)) * SCALEBAR_PX;

      const pass = currentScaleBarM <= DESIRED_SCALEBAR_M;

      if (!pass || enabledKinds.length === 0) {
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
      const gridSize = shortEdgeM > 3200 ? 3 : shortEdgeM > 2000 ? 2 : 1;
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
        const code = KAKAO_CATEGORY[kind];
        const keyword = KAKAO_KEYWORD[kind];

        const perKindLimit = Math.min(maxResultsPerKind * 2, 200);

        // 병렬 수집
        const chunks = await Promise.all(
          cells.map((cell) => {
            if (code) {
              return searchCategoryAllPagesByBounds(
                kakao,
                placesRef.current,
                code,
                cell,
                perKindLimit
              );
            } else if (keyword) {
              return searchKeywordAllPagesByBounds(
                kakao,
                placesRef.current,
                keyword,
                cell,
                perKindLimit
              );
            } else {
              return Promise.resolve<any[]>([]);
            }
          })
        );
        let acc: any[] = chunks.flat();

        // 중복 제거
        const dedup: any[] = [];
        const seenIds = new Set<string>();
        for (const p of acc) {
          const id = p.id ?? `${p.x},${p.y}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          dedup.push(p);
        }

        // 가까운/먼 것 섞어서 선택
        const radiusM = RADIUS_BY_KIND[kind] ?? 1000;
        const pick = pickNearFar(
          dedup,
          cLat,
          cLng,
          radiusM,
          maxResultsPerKind,
          NEAR_RATIO
        );

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
