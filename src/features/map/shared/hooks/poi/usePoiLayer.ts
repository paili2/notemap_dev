"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  PoiKind,
  KAKAO_CATEGORY,
  KAKAO_KEYWORD,
  createPoiOverlay,
  calcPoiSizeByLevel,
} from "@/features/map/shared/overlays/poiOverlays";
import {
  DEFAULTS,
  IDLE_THROTTLE_MS,
  VISIBLE_MAX_LEVEL,
  SCALEBAR_PX,
  DESIRED_SCALEBAR_M,
  RADIUS_BY_KIND,
} from "./constants";
import { distM } from "./geometry";

import { useThrottle } from "./throttle";
import {
  searchKeywordAllPagesByBounds,
  pickNearFar,
  gridCellsSortedByCenter,
  searchCategoryAllPagesByBounds,
} from "./search";

type UsePoiLayerOptions = {
  kakaoSDK?: any | null;
  map?: any | null;
  enabledKinds?: PoiKind[];
  maxResultsPerKind?: number;
  minViewportEdgeMeters?: number; // 호환 유지(미사용)
  showAtOrBelowLevel?: number; // 호환 유지(미사용)
};

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

  const getKakaoBounds = useCallback(
    () => (map && kakao ? map.getBounds() : null),
    [map, kakao]
  );

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
    const TH = 0.0005; // ≈ 50~60m
    return (
      d(a.sw.lat, b.sw.lat) > TH ||
      d(a.sw.lng, b.sw.lng) > TH ||
      d(a.ne.lat, b.ne.lat) > TH ||
      d(a.ne.lng, b.ne.lng) > TH
    );
  }, []);

  const lastBoxRef = useRef<{
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null>(null);
  const reqSeqRef = useRef(0);
  const placesRef = useRef<any | null>(null);
  const wasVisibleRef = useRef<boolean>(false);

  const runSearch = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!map || !kakao) return;

      // 1) 레벨 & 스케일바 게이트
      const lv = map.getLevel();
      const levelPass = lv <= VISIBLE_MAX_LEVEL;

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
      const scalebarPass = currentScaleBarM <= DESIRED_SCALEBAR_M;

      if (!levelPass || !scalebarPass || enabledKinds.length === 0) {
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

      // 넓은 화면은 셀로 쪼개서 중심 가까운 순으로
      const shortEdgeM = getMinViewportEdgeMeters();
      const cells: any[] = gridCellsSortedByCenter(
        kakao,
        boundsObj,
        shortEdgeM,
        map
      );
      const nextKeys = new Set<string>();
      const lvNow = map.getLevel();
      const { size: initSize, iconSize: initIconSize } =
        calcPoiSizeByLevel(lvNow);

      for (const kind of enabledKinds) {
        const code = KAKAO_CATEGORY[kind];
        const keyword = KAKAO_KEYWORD[kind];
        const perKindLimit = Math.min(maxResultsPerKind * 2, 200);

        // 병렬 수집
        const chunks = await Promise.all(
          cells.map((cell) =>
            code
              ? searchCategoryAllPagesByBounds(
                  kakao,
                  placesRef.current,
                  code,
                  cell,
                  perKindLimit
                )
              : keyword
              ? searchKeywordAllPagesByBounds(
                  kakao,
                  placesRef.current,
                  keyword,
                  cell,
                  perKindLimit
                )
              : Promise.resolve<any[]>([])
          )
        );
        const acc = chunks.flat();

        // dedup
        const seenIds = new Set<string>();
        const dedup: any[] = [];
        for (const p of acc) {
          const id = p.id ?? `${p.x},${p.y}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          dedup.push(p);
        }

        // 가까운/먼 결과 섞기
        const center = map.getCenter();
        const cLat = center.getLat();
        const cLng = center.getLng();
        const radiusM = RADIUS_BY_KIND[kind] ?? 1000;
        const pick = pickNearFar(dedup, cLat, cLng, radiusM, maxResultsPerKind);

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

      // stale 제거
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

  const throttled = useThrottle(runSearch, IDLE_THROTTLE_MS);

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

  // 줌 레벨 변화: 크기 스케일 + 가시성 버킷 전환 대응
  useEffect(() => {
    if (!map || !kakao) return;

    wasVisibleRef.current = map.getLevel() <= VISIBLE_MAX_LEVEL;

    const onZoomChanged = () => {
      const lv = map.getLevel();

      // 1) 사이즈 즉시 갱신
      const { size, iconSize } = calcPoiSizeByLevel(lv);
      for (const [, inst] of overlaysRef.current)
        inst.update({ size, iconSize });

      // 2) 가시성 버킷 전환(>3 ↔ ≤3)
      const nowVisible = lv <= VISIBLE_MAX_LEVEL;
      if (nowVisible !== wasVisibleRef.current) {
        wasVisibleRef.current = nowVisible;
        if (nowVisible) runSearch({ force: true });
        else {
          for (const [, inst] of overlaysRef.current) inst.destroy();
          overlaysRef.current.clear();
        }
      } else if (nowVisible) {
        throttled();
      }
    };

    onZoomChanged(); // 초기 1회
    kakao.maps.event.addListener(map, "zoom_changed", onZoomChanged);
    return () =>
      kakao.maps.event.removeListener(map, "zoom_changed", onZoomChanged);
  }, [map, kakao, throttled, runSearch]);

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
