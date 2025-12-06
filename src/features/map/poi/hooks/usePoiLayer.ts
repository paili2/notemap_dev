"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  DEFAULTS,
  IDLE_THROTTLE_MS,
  VISIBLE_MAX_LEVEL,
  RADIUS_BY_KIND,
} from "../lib/constants";
import { useThrottle } from "../lib/throttle";
import {
  BoundsBox,
  OverlayInst,
  UsePoiLayerOptions,
} from "../usePoiLayer.types";
import {
  calcScalebarPass,
  ensurePlacesInstance,
  getKakaoBounds,
  getMinViewportEdgeMeters,
  getViewportBox,
  movedEnough,
} from "../lib/utils";
import {
  gridCellsSortedByCenter,
  pickNearFar,
  searchCategoryAllPagesByBounds,
  searchKeywordAllPagesByBounds,
} from "../lib/search";
import {
  calcPoiSizeByLevel,
  KAKAO_CATEGORY,
  KAKAO_KEYWORD,
} from "@/features/map/poi/lib/poiMeta";
import { PoiKind } from "../lib/poiTypes";
import { createPoiOverlay } from "../../components/mapview/overlays/poiOverlays";

export function usePoiLayer({
  kakaoSDK,
  map,
  enabledKinds = [],
  maxResultsPerKind = DEFAULTS.maxResultsPerKind,
}: UsePoiLayerOptions) {
  const kakao =
    kakaoSDK ?? (typeof window !== "undefined" ? (window as any).kakao : null);

  const overlaysRef = useRef<Map<string, OverlayInst>>(new Map());

  // ✅ enabledKinds는 ref로 보관 (stale 콜백 방지)
  const enabledKindsRef = useRef<PoiKind[]>(enabledKinds);
  useEffect(() => {
    enabledKindsRef.current = enabledKinds;
  }, [enabledKinds]);

  const lastBoxRef = useRef<BoundsBox | null>(null);
  const reqSeqRef = useRef(0);
  const placesRef = useRef<any | null>(null);
  const wasVisibleRef = useRef<boolean>(false);

  const runSearch = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!map || !kakao) return;

      const kinds = enabledKindsRef.current;
      const overlays = overlaysRef.current;

      // 🔹 1) 종류가 0개면 전부 숨기고 종료
      if (!kinds.length) {
        for (const [, inst] of overlays) {
          if (inst.visible) {
            inst.hide();
            inst.visible = false;
          }
        }
        return;
      }

      const level = map.getLevel();
      const levelPass = level <= VISIBLE_MAX_LEVEL;
      if (!levelPass) {
        // 너무 축소/확대면 기존 오버레이는 유지, 검색만 스킵
        return;
      }

      const minEdgeM = getMinViewportEdgeMeters(map, kakao);
      const scalebarPass = calcScalebarPass(map, kakao, minEdgeM);
      if (!scalebarPass) {
        // 축척이 너무 넓으면 검색만 스킵
        return;
      }

      // 🔹 2) 영역/박스 변경 체크
      const bbox = getViewportBox(map, kakao);
      if (!bbox) return;
      if (!opts?.force && !movedEnough(bbox, lastBoxRef.current)) return;
      lastBoxRef.current = bbox;

      const mySeq = ++reqSeqRef.current;
      const places = ensurePlacesInstance(kakao, placesRef);
      const boundsObj = getKakaoBounds(map, kakao);

      if (!boundsObj || !places) return;

      // 🔹 3) 셀 분할 + 초기 아이콘 크기 계산
      const shortEdgeM = getMinViewportEdgeMeters(map, kakao);
      const cells: any[] = gridCellsSortedByCenter(
        kakao,
        boundsObj,
        shortEdgeM,
        map
      );

      const lvNow = map.getLevel();
      const { size: initSize, iconSize: initIconSize } =
        calcPoiSizeByLevel(lvNow);

      // 🔹 4) 종류별로 카카오 검색 + 오버레이 갱신
      for (const kind of kinds) {
        const code = KAKAO_CATEGORY[kind];
        const keyword = KAKAO_KEYWORD[kind];
        const perKindLimit = Math.min(maxResultsPerKind * 2, 200);

        const chunks = await Promise.all(
          cells.map((cell) =>
            code
              ? searchCategoryAllPagesByBounds(
                  kakao,
                  places,
                  code,
                  cell,
                  perKindLimit
                )
              : keyword
              ? searchKeywordAllPagesByBounds(
                  kakao,
                  places,
                  keyword,
                  cell,
                  perKindLimit
                )
              : Promise.resolve<any[]>([])
          )
        );

        const acc = chunks.flat();

        // ✅ id 기준 dedup
        const seenIds = new Set<string>();
        const dedup: any[] = [];
        for (const p of acc) {
          const id = p.id ?? `${p.x},${p.y}`;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          dedup.push(p);
        }

        const filtered = dedup;

        const center = map.getCenter();
        const cLat = center.getLat();
        const cLng = center.getLng();
        const radiusM = RADIUS_BY_KIND[kind] ?? 1000;
        const pick = pickNearFar(
          filtered,
          cLat,
          cLng,
          radiusM,
          maxResultsPerKind
        );

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

      // 🔹 최신 요청만 유효
      if (mySeq !== reqSeqRef.current) {
        return;
      }
      // stale 오버레이는 여기서 손대지 않음 (깜빡임 방지)
    },
    [map, kakao, maxResultsPerKind]
  );

  const throttled = useThrottle(runSearch, IDLE_THROTTLE_MS);

  // idle 이벤트로 검색 트리거 + 정리
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

  // 줌 레벨에 따라 크기만 조절 + 버킷 전환시만 hide/show
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

  // ✅ 종류(enabledKinds) 변경 시: 빠진 kind 오버레이만 제거 + 새 조합으로 재검색
  const prevKindsRef = useRef<PoiKind[]>([]);
  useEffect(() => {
    const prev = prevKindsRef.current;
    const next = enabledKinds;
    const overlays = overlaysRef.current;

    // 제거된 종류들만 정리
    const removedKinds = prev.filter((k) => !next.includes(k));
    if (removedKinds.length) {
      for (const [key, inst] of overlays.entries()) {
        if (removedKinds.some((kind) => key.startsWith(`${kind}:`))) {
          inst.destroy();
          overlays.delete(key);
        }
      }
    }

    prevKindsRef.current = next.slice();

    // 모두 OFF면 나머지도 정리
    if (next.length === 0) {
      for (const [, inst] of overlays) {
        inst.destroy();
      }
      overlays.clear();
      return;
    }

    // 박스 초기화 후, 새로운 조합 기준으로 검색만 한 번 갱신
    lastBoxRef.current = null;
    runSearch({ force: true });
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
