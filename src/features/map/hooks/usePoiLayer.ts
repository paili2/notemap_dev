"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KAKAO_CATEGORY, POI_ICON, PoiKind } from "../lib/poiCategory";
import {
  upsertPoiMarker,
  reconcilePoiMarkers,
  clearMarkers,
} from "../lib/poiMarkers";

export type UsePoiLayerOptions = {
  kakaoSDK?: any | null; // window.kakao 또는 주입된 SDK
  map?: any | null; // kakao.maps.Map
  enabledKinds?: PoiKind[]; // 보여줄 종류
  maxResultsPerKind?: number; // 각 종류당 최대 마커 수
  /** 화면의 '짧은 변' 길이가 이 값(미터) 이하일 때만 POI 표시. 1000m = 좌우/상하 500m 범위 */
  minViewportEdgeMeters?: number;
  /** 이 레벨 이하일 때 POI 표시 (숫자 작을수록 더 확대) */
  showAtOrBelowLevel?: number;
  busStopFetcher?: (bbox: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  }) => Promise<{ id: string; name: string; lat: number; lng: number }[]>;
};

// 기본값/튜닝
const DEFAULTS = {
  maxResultsPerKind: 40,
  minViewportEdgeMeters: 1000, // 짧은 변 1km → 체감 500m부터
  showAtOrBelowLevel: 6, // map.getLevel() <= 6 에서 표시 (필요시 7로)
} as const;

const IDLE_THROTTLE_MS = 1200; // 검색 스로틀

// 간단 throttle
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

export function usePoiLayer({
  kakaoSDK,
  map,
  enabledKinds = [],
  maxResultsPerKind = DEFAULTS.maxResultsPerKind,
  minViewportEdgeMeters = DEFAULTS.minViewportEdgeMeters,
  showAtOrBelowLevel = DEFAULTS.showAtOrBelowLevel,
  busStopFetcher,
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

  // bounds → BBox
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

  // 뷰포트 짧은 변 길이(m)
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

  // 바운즈 변화가 충분할 때만 재검색(약 ~200m 기준)
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

  const runSearch = useCallback(async () => {
    if (!map || !kakao) return;

    // ▼ 레벨/거리 듀얼 게이트: 둘 중 하나라도 통과하면 표시
    const lv = map.getLevel();
    const minEdge = getMinViewportEdgeMeters();
    const pass = lv <= showAtOrBelowLevel || minEdge <= minViewportEdgeMeters;

    if (!pass) {
      // 너무 멀면 표시/검색 모두 중단 (기존 마커 정리)
      setMarkers((prev) => {
        clearMarkers(prev);
        return [];
      });
      return;
    }

    const bbox = getBoundsBox();
    if (!bbox) return;
    if (!movedEnough(bbox, lastBoxRef.current)) return;
    lastBoxRef.current = bbox;

    const mySeq = ++reqSeqRef.current;

    const nextKeys = new Set<string>();
    const list: any[] = [];

    // 1) 카테고리(편의점/카페/약국/지하철)
    const nonBusKinds = enabledKinds.filter((k) => k !== "busstop") as Exclude<
      PoiKind,
      "busstop"
    >[];
    if (nonBusKinds.length) {
      if (!placesRef.current) {
        placesRef.current = new kakao.maps.services.Places(map);
      }
      await Promise.all(
        nonBusKinds.map(
          (kind) =>
            new Promise<void>((resolve) => {
              const code = KAKAO_CATEGORY[kind];
              placesRef.current!.categorySearch(
                code,
                (data: any[], status: string) => {
                  if (
                    status === kakao.maps.services.Status.OK &&
                    Array.isArray(data)
                  ) {
                    data.slice(0, maxResultsPerKind).forEach((p) => {
                      const x = Number(p.x);
                      const y = Number(p.y);
                      const key = `${kind}:${p.id ?? `${x},${y}`}`;
                      const m = upsertPoiMarker(
                        kakao,
                        map,
                        key,
                        x,
                        y,
                        p.place_name,
                        POI_ICON[kind]
                      );
                      nextKeys.add(key);
                      list.push(m);
                    });
                  }
                  resolve();
                },
                { useMapBounds: true }
              );
            })
        )
      );
    }

    // 2) 버스정류장
    if (enabledKinds.includes("busstop") && busStopFetcher) {
      try {
        const stops = await busStopFetcher(bbox);
        stops.slice(0, maxResultsPerKind).forEach((s) => {
          const key = `busstop:${s.id ?? `${s.lng},${s.lat}`}`;
          const m = upsertPoiMarker(
            kakao,
            map,
            key,
            s.lng,
            s.lat,
            s.name,
            POI_ICON["busstop"]
          );
          nextKeys.add(key);
          list.push(m);
        });
      } catch (e) {
        console.error("busStopFetcher error", e);
      }
    }

    if (mySeq !== reqSeqRef.current) return;

    reconcilePoiMarkers(nextKeys);
    setMarkers(list);
  }, [
    map,
    kakao,
    enabledKinds,
    maxResultsPerKind,
    minViewportEdgeMeters,
    showAtOrBelowLevel,
    getMinViewportEdgeMeters,
    getBoundsBox,
    movedEnough,
    busStopFetcher,
  ]);

  const throttled = useThrottle(runSearch);

  useEffect(() => {
    if (!map || !kakao) return;
    const handler = () => throttled();
    kakao.maps.event.addListener(map, "idle", handler);
    runSearch(); // 최초 1회
    return () => {
      kakao.maps.event.removeListener(map, "idle", handler);
      setMarkers((prev) => {
        clearMarkers(prev);
        return [];
      });
    };
  }, [map, kakao, throttled, runSearch]);

  // 종류 바뀌면 즉시 재검색
  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKinds.join(",")]);

  return { markers, refresh: runSearch, clear: () => clearMarkers(markers) };
}
