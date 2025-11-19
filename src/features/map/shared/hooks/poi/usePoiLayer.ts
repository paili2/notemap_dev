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

type OverlayInst = {
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
  show: () => void;
  hide: () => void;
  visible: boolean;
};

export function usePoiLayer({
  kakaoSDK,
  map,
  enabledKinds = [],
  maxResultsPerKind = DEFAULTS.maxResultsPerKind,
}: UsePoiLayerOptions) {
  const kakao =
    kakaoSDK ?? (typeof window !== "undefined" ? (window as any).kakao : null);

  const overlaysRef = useRef<Map<string, OverlayInst>>(new Map());

  // ✅ enabledKinds는 ref로 보관해서 예전 runSearch 호출도 항상 최신 값을 보게 하기
  const enabledKindsRef = useRef<PoiKind[]>(enabledKinds);
  useEffect(() => {
    enabledKindsRef.current = enabledKinds;
  }, [enabledKinds]);

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

      const kinds = enabledKindsRef.current;
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

      const overlays = overlaysRef.current;

      // 🔹 1) 토글 완전 OFF → 전부 숨기고 종료
      if (!kinds.length) {
        for (const [, inst] of overlays) {
          if (inst.visible) {
            inst.hide();
            inst.visible = false;
          }
        }
        return;
      }

      // 🔹 2) 너무 축소/확대된 상태면 "검색만 스킵"하고, 이미 그려진 건 유지
      //     (여기서 숨기지 않음 → 경계 근처에서 깜빡임 방지)
      if (!levelPass || !scalebarPass) {
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

      const shortEdgeM = getMinViewportEdgeMeters();
      const cells: any[] = gridCellsSortedByCenter(
        kakao,
        boundsObj,
        shortEdgeM,
        map
      );

      const lvNow = map.getLevel();
      const { size: initSize, iconSize: initIconSize } =
        calcPoiSizeByLevel(lvNow);

      for (const kind of kinds) {
        const code = KAKAO_CATEGORY[kind];
        const keyword = KAKAO_KEYWORD[kind];
        const perKindLimit = Math.min(maxResultsPerKind * 2, 200);

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

        const seenIds = new Set<string>();
        const dedup: any[] = [];
        for (const p of acc) {
          const id = p.id ?? `${p.x},${p.y}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          dedup.push(p);
        }

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

          const ex = overlays.get(key);
          if (ex) {
            ex.update({ lat: y, lng: x, zIndex: 3, kind });
            if (!ex.visible) {
              ex.show();
              ex.visible = true;
            }
          } else {
            const { destroy, update, show, hide } = createPoiOverlay(
              kakao,
              map,
              { id: key, kind, lat: y, lng: x, zIndex: 3 },
              { size: initSize, iconSize: initIconSize }
            );
            overlays.set(key, {
              destroy,
              update,
              show,
              hide,
              visible: true,
            });
          }
        }
      }

      // 🔹 중간에 더 최신 검색이 들어오면, 이 검색 결과는 무시
      //    (stale 결과가 기존 오버레이를 건들지 않게)
      if (mySeq !== reqSeqRef.current) {
        return;
      }
      // ❗ stale 오버레이를 여기서 hide/destroy 하지 않음 → 깜빡임 최소화
    },
    [
      map,
      kakao,
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

  // 줌 레벨에 따라 크기만 조절 + 버킷 전환 시만 검색/숨김
  useEffect(() => {
    if (!map || !kakao) return;

    wasVisibleRef.current = map.getLevel() <= VISIBLE_MAX_LEVEL;

    const onZoomChanged = () => {
      const lv = map.getLevel();
      const { size, iconSize } = calcPoiSizeByLevel(lv);
      for (const [, inst] of overlaysRef.current) {
        inst.update({ size, iconSize });
      }

      const nowVisible = lv <= VISIBLE_MAX_LEVEL;
      if (nowVisible !== wasVisibleRef.current) {
        wasVisibleRef.current = nowVisible;
        if (nowVisible && enabledKindsRef.current.length > 0) {
          runSearch({ force: true });
        } else if (!nowVisible) {
          // 너무 멀어지면 아이콘만 숨김
          for (const [, inst] of overlaysRef.current) {
            if (inst.visible) {
              inst.hide();
              inst.visible = false;
            }
          }
        }
      }
    };

    onZoomChanged(); // 초기 1회
    kakao.maps.event.addListener(map, "zoom_changed", onZoomChanged);
    return () =>
      kakao.maps.event.removeListener(map, "zoom_changed", onZoomChanged);
  }, [map, kakao, runSearch]);

  // 종류 변경 시: 박스 초기화 + 강제 검색 (기존 오버레이는 유지)
  useEffect(() => {
    lastBoxRef.current = null;
    if (enabledKinds.length === 0) {
      // 전부 끌 때는 완전히 정리
      for (const [, inst] of overlaysRef.current) {
        inst.destroy();
      }
      overlaysRef.current.clear();
    } else {
      runSearch({ force: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKinds.join(","), runSearch]);

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
