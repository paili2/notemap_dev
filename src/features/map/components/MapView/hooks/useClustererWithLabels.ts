import { useEffect, useMemo, useRef } from "react";
import type { MapMarker } from "@/features/map/types/map";
import { PinKind } from "@/features/pins/types";
import { getPinUrl, PIN_ACCENTS } from "@/features/pins/lib/assets";
import { styleHitboxEl, styleLabelEl } from "@/features/map/lib/overlays/style";
import { HITBOX, LABEL, PIN_MARKER, Z } from "@/features/map/lib/constants";

export type ClustererWithLabelsOptions = {
  labelMaxLevel?: number; // 라벨/핀 보이는 최대 레벨 (이하: 라벨모드)
  clusterMinLevel?: number; // 클러스터 시작 레벨 (이상: 클러스터모드)
  onMarkerClick?: (id: string) => void;
  fitToMarkers?: boolean;
  labelGapPx?: number; // 라벨을 핀 머리 위로 띄우는 여백(px)
  hitboxSizePx?: number; // 핀 클릭 판정 원(투명) 지름(px)
  defaultPinKind?: PinKind; // 마커에 kind 없을 때 기본 핀
  hideLabelForId?: string | null; // 말풍선 열린 핀 id
};

export function useClustererWithLabels(
  kakao: any,
  map: any,
  markers: MapMarker[],
  {
    labelMaxLevel = 5,
    clusterMinLevel = 6,
    onMarkerClick,
    fitToMarkers = false,
    labelGapPx = LABEL.GAP_PX,
    hitboxSizePx = HITBOX.DIAMETER_PX,
    defaultPinKind = "1room",
    hideLabelForId = null,
  }: ClustererWithLabelsOptions = {}
) {
  const markerObjsRef = useRef<Record<string, any>>({});
  const markerClickHandlersRef = useRef<
    Record<string, ((...args: any[]) => void) | null>
  >({});
  const labelOvRef = useRef<Record<string, any>>({});
  const hitboxOvRef = useRef<Record<string, any>>({});
  const clustererRef = useRef<any>(null);

  // onMarkerClick을 ref로 고정 (무거운 이펙트 deps에서 제외)
  const onMarkerClickRef = useRef<typeof onMarkerClick>();
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // 위치/개수/아이디만 반영 (순서 영향 제거)
  const markersKey = useMemo(() => {
    return [...markers]
      .map(
        (m) =>
          `${m.id}:${m.position.lat.toFixed(6)},${m.position.lng.toFixed(6)}`
      )
      .sort()
      .join("|");
  }, [markers]);

  const preloadedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = new Set<string>();
    markers.forEach((m) => {
      const kind: PinKind = ((m as any).kind ?? defaultPinKind) as PinKind;
      const url = getPinUrl(kind);
      if (typeof url === "string" && url) urls.add(url);
    });
    urls.forEach((url) => {
      if (preloadedRef.current.has(url)) return;
      const img = new Image();
      img.src = url;
      preloadedRef.current.add(url);
    });
  }, [markersKey, defaultPinKind]);

  // 이전 선택 id 기억 (라이트 이펙트에서 복원용)
  const prevSelectedIdRef = useRef<string | null>(null);

  // 안전 경계
  const safeLabelMax = Math.min(labelMaxLevel, clusterMinLevel - 1);

  /** 클러스터 모드에서 선택 마커를 지도에 직접 올리고 나머지는 클러스터러로 */
  const mountClusterMode = (selectedId: string | null) => {
    const entries = Object.entries(markerObjsRef.current) as [string, any][];
    const mkList = entries.map(([, mk]) => mk);

    // 라벨/히트박스 숨김
    (Object.values(labelOvRef.current) as any[]).forEach((ov) =>
      ov.setMap(null)
    );
    (Object.values(hitboxOvRef.current) as any[]).forEach((ov) =>
      ov.setMap(null)
    );

    // 클리어 후 재배치
    clustererRef.current?.clear?.();

    const rest = selectedId
      ? entries.filter(([id]) => id !== selectedId).map(([, mk]) => mk)
      : mkList;

    if (rest.length) clustererRef.current?.addMarkers?.(rest);

    if (selectedId) {
      const sel = markerObjsRef.current[selectedId];
      try {
        clustererRef.current?.removeMarker?.(sel);
      } catch {}
      sel?.setMap?.(map);
      sel?.setZIndex?.(1000);
    } else {
      mkList.forEach((mk) => mk.setMap?.(null));
    }

    clustererRef.current?.redraw?.();
  };

  // 1) 클러스터러 초기화 및 clusterclick 리스너
  useEffect(() => {
    if (!kakao || !map) return;

    if (!clustererRef.current) {
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: clusterMinLevel,
      });
    } else {
      try {
        clustererRef.current.setMinLevel?.(clusterMinLevel);
      } catch {}
    }

    const handler = (cluster: any) => {
      try {
        const center = cluster.getCenter();
        const nextLevel = Math.max(1, map.getLevel() - 1);
        map.setLevel(nextLevel, { anchor: center });
      } catch {}
    };

    kakao.maps.event.addListener(clustererRef.current, "clusterclick", handler);
    return () => {
      kakao?.maps?.event?.removeListener?.(
        clustererRef.current,
        "clusterclick",
        handler
      );
    };
  }, [kakao, map, clusterMinLevel]);

  // 2) 마커/라벨/히트박스 생성 및 정리 (무거운 이펙트)
  // ⚠ hideLabelForId, onMarkerClick, fitToMarkers 는 deps에서 제외
  useEffect(() => {
    if (!kakao || !map) return;

    // 이전 리소스 정리
    Object.entries(markerClickHandlersRef.current).forEach(([id, handler]) => {
      const mk = markerObjsRef.current[id];
      if (mk && handler) kakao.maps.event.removeListener(mk, "click", handler);
    });
    markerClickHandlersRef.current = {};
    Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
    labelOvRef.current = {};
    Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
    hitboxOvRef.current = {};
    clustererRef.current?.clear?.();
    Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(null));
    markerObjsRef.current = {};

    // 생성
    markers.forEach((m) => {
      const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);

      // kind/색상/아이콘
      const kind: PinKind = ((m as any).kind ?? defaultPinKind) as PinKind;
      const accent = PIN_ACCENTS[kind] ?? "#3B82F6";
      const iconUrl = getPinUrl(kind);

      // 마커
      const mkOptions: any = {
        position: pos,
        title: m.title ?? String(m.id),
        zIndex: m.id === "__draft__" ? Z.DRAFT_PIN : 0,
      };

      if (iconUrl && typeof iconUrl === "string") {
        try {
          const markerSize = new kakao.maps.Size(
            PIN_MARKER.size.w,
            PIN_MARKER.size.h
          );
          const markerOffset = new kakao.maps.Point(
            PIN_MARKER.offset.x,
            PIN_MARKER.offset.y
          );
          mkOptions.image = new kakao.maps.MarkerImage(iconUrl, markerSize, {
            offset: markerOffset,
          });
        } catch {
          /* 폴백: 기본 마커 */
        }
      }

      const mk = new kakao.maps.Marker(mkOptions);
      markerObjsRef.current[m.id] = mk;

      // 클릭 리스너: ref 사용
      const handler = () => onMarkerClickRef.current?.(m.id);
      kakao.maps.event.addListener(mk, "click", handler);
      markerClickHandlersRef.current[m.id] = handler;

      // 라벨
      const labelEl = document.createElement("div");
      labelEl.className = "kakao-label";
      labelEl.innerText = m.title ?? String(m.id);
      styleLabelEl(labelEl, accent, labelGapPx);

      const labelOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: labelEl,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: LABEL.Z_INDEX,
      });
      labelOvRef.current[m.id] = labelOv;

      // 히트박스
      const hitEl = document.createElement("div");
      hitEl.className = "kakao-hitbox";
      styleHitboxEl(hitEl, hitboxSizePx);
      hitEl.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        onMarkerClickRef.current?.(m.id);
      });

      const hitOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: hitEl,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: HITBOX.Z_INDEX,
        clickable: true,
      });
      hitboxOvRef.current[m.id] = hitOv;
    });

    // 초기 모드 적용
    const applyMode = () => {
      const level = map.getLevel();

      const entries = Object.entries(markerObjsRef.current) as [string, any][];
      const mkList = entries.map(([, mk]) => mk);
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      const hitEntries = Object.entries(hitboxOvRef.current) as [string, any][];

      if (level <= safeLabelMax) {
        // 라벨 모드
        clustererRef.current?.clear?.();
        mkList.forEach((mk) => mk.setMap(map));
        labelEntries.forEach(([id, ov]) =>
          ov.setMap(hideLabelForId && id === hideLabelForId ? null : map)
        );
        hitEntries.forEach(([id, ov]) =>
          ov.setMap(hideLabelForId && id === hideLabelForId ? null : map)
        );
        if (hideLabelForId)
          markerObjsRef.current[hideLabelForId]?.setZIndex?.(1000);
        return;
      }

      if (level >= clusterMinLevel) {
        // 클러스터 모드: 선택 마커만 지도에 직접
        mountClusterMode(hideLabelForId ?? null);
        return;
      }

      // 중간 모드: 마커 + 히트박스 (라벨 숨김)
      (Object.values(labelOvRef.current) as any[]).forEach((ov) =>
        ov.setMap(null)
      );
      clustererRef.current?.clear?.();
      mkList.forEach((mk) => mk.setMap(map));
      hitEntries.forEach(([, ov]) => ov.setMap(map));
    };

    applyMode();

    // 정리
    return () => {
      Object.entries(markerClickHandlersRef.current).forEach(
        ([id, handler]) => {
          const mk = markerObjsRef.current[id];
          if (mk && handler)
            kakao.maps.event.removeListener(mk, "click", handler);
        }
      );
      markerClickHandlersRef.current = {};

      clustererRef.current?.clear?.();
      Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(null));
      Object.values(markerObjsRef.current).forEach((mk: any) =>
        mk.setMap(null)
      );

      labelOvRef.current = {};
      hitboxOvRef.current = {};
      markerObjsRef.current = {};
    };
  }, [
    kakao,
    map,
    markersKey,
    safeLabelMax,
    clusterMinLevel,
    // onMarkerClick 제외!
    // fitToMarkers 제외!
    labelGapPx,
    hitboxSizePx,
    defaultPinKind,
    // hideLabelForId 제외! (라이트 이펙트에서만 처리)
  ]);

  // 2.5) fitToMarkers 전용: bounds만 맞추는 가벼운 이펙트
  useEffect(() => {
    if (!kakao || !map) return;
    if (!fitToMarkers) return;
    if (!markers.length) return;

    const bounds = new kakao.maps.LatLngBounds();
    markers.forEach((m) =>
      bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng))
    );
    map.setBounds(bounds);
  }, [kakao, map, fitToMarkers, markersKey]);

  // 3) 줌 변화에 따른 표시 모드 적용(가벼운 이펙트)
  useEffect(() => {
    if (!kakao || !map) return;

    const applyMode = () => {
      const level = map.getLevel();
      const mkList = Object.values(markerObjsRef.current) as any[];
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      const hitEntries = Object.entries(hitboxOvRef.current) as [string, any][];

      if (level <= safeLabelMax) {
        clustererRef.current?.clear?.();
        mkList.forEach((mk) => mk.setMap(map));
        labelEntries.forEach(([id, ov]) =>
          ov.setMap(hideLabelForId && id === hideLabelForId ? null : map)
        );
        hitEntries.forEach(([id, ov]) =>
          ov.setMap(hideLabelForId && id === hideLabelForId ? null : map)
        );
        if (hideLabelForId)
          markerObjsRef.current[hideLabelForId]?.setZIndex?.(1000);
        return;
      }

      if (level >= clusterMinLevel) {
        // 클러스터 모드
        mountClusterMode(hideLabelForId ?? null);
        return;
      }

      // 중간 모드
      labelEntries.forEach(([, ov]) => ov.setMap(null));
      clustererRef.current?.clear?.();
      mkList.forEach((mk) => mk.setMap(map));
      hitEntries.forEach(([, ov]) => ov.setMap(map));
    };

    kakao.maps.event.addListener(map, "zoom_changed", applyMode);
    applyMode();
    return () => {
      kakao?.maps?.event?.removeListener?.(map, "zoom_changed", applyMode);
    };
  }, [kakao, map, safeLabelMax, clusterMinLevel, hideLabelForId]);

  // 4) 선택된 핀 변경 시 라벨/히트박스 토글 + 클러스터러↔지도 이동 (라이트 이펙트)
  useEffect(() => {
    if (!kakao || !map) return;

    const level = map.getLevel();
    const selectedId = hideLabelForId ?? null;
    const prevId = prevSelectedIdRef.current;

    // 라벨 모드: 라벨/히트박스만 토글 + zIndex
    if (level <= safeLabelMax) {
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      labelEntries.forEach(([id, ov]) => {
        ov.setMap(selectedId && id === selectedId ? null : map);
      });
      const hitEntries = Object.entries(hitboxOvRef.current) as [string, any][];
      hitEntries.forEach(([id, ov]) => {
        ov.setMap(selectedId && id === selectedId ? null : map);
      });
      if (selectedId) {
        const mk = markerObjsRef.current[selectedId];
        mk?.setMap?.(map); // ✅ 혹시 빠져있으면 다시 지도에 올림
        mk?.setZIndex?.(1000);
      }
      prevSelectedIdRef.current = selectedId;
      return;
    }

    // 클러스터 모드: 선택 마커는 클러스터러에서 제거하고 지도에 직접 올림
    if (level >= clusterMinLevel) {
      const clusterer = clustererRef.current;
      if (prevId && prevId !== selectedId) {
        const prevMk = markerObjsRef.current[prevId];
        try {
          prevMk?.setMap?.(null);
          clusterer?.addMarker?.(prevMk);
        } catch {}
      }
      if (selectedId) {
        const sel = markerObjsRef.current[selectedId];
        try {
          clusterer?.removeMarker?.(sel);
        } catch {}
        sel?.setMap?.(map);
        sel?.setZIndex?.(1000);
      }
      clusterer?.redraw?.();
      prevSelectedIdRef.current = selectedId;
      return;
    }

    // 중간 모드: 별도 처리 없음
    prevSelectedIdRef.current = selectedId;
  }, [kakao, map, hideLabelForId, safeLabelMax, clusterMinLevel]);
}

export default useClustererWithLabels;
