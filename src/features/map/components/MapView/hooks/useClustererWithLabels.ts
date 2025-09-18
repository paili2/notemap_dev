import { useEffect, useMemo, useRef, useState } from "react";
import type { MapMarker } from "@/features/map/types/map";
import { PinKind } from "@/features/pins/types";
import { getPinUrl } from "@/features/pins/lib/assets";
import { HITBOX, LABEL, PIN_MARKER, Z } from "@/features/map/lib/constants";

export type ClustererWithLabelsOptions = {
  labelMaxLevel?: number;
  clusterMinLevel?: number;
  onMarkerClick?: (id: string) => void;
  fitToMarkers?: boolean;
  labelGapPx?: number;
  hitboxSizePx?: number;
  defaultPinKind?: PinKind;
  hideLabelForId?: string | null;
};

const ACCENT = "#3B82F6";
const DRAFT_ID = "__draft__";

const applyLabelStyles = (el: HTMLDivElement, gapPx = 12) => {
  Object.assign(el.style, {
    transform: `translateY(calc(-150% - ${gapPx}px))`,
    padding: "6px 10px",
    borderRadius: "8px",
    background: ACCENT,
    color: "#ffffff",
    fontWeight: "700",
    border: "1px solid rgba(0,0,0,0.12)",
    boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
    fontSize: "12px",
    lineHeight: "1",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    userSelect: "none",
  } as CSSStyleDeclaration);
};

const applyHitboxStyles = (el: HTMLDivElement, sizePx = 48) => {
  const size = `${sizePx}px`;
  Object.assign(el.style, {
    width: size,
    height: size,
    borderRadius: "9999px",
    background: "rgba(0,0,0,0)",
    // pointerEvents 는 런타임에 장치 타입별로 설정
    cursor: "pointer",
    touchAction: "manipulation",
  } as CSSStyleDeclaration);
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
  // ✅ 터치 디바이스 감지 (실시간 반응)
  const [isCoarsePointer, setIsCoarsePointer] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const noHover = window.matchMedia?.("(hover: none)")?.matches ?? false;
    const touch =
      "ontouchstart" in window || (navigator as any).maxTouchPoints > 0;
    return coarse || noHover || touch;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqNoHover = window.matchMedia("(hover: none)");
    const update = () => {
      const coarse = mqCoarse.matches;
      const noHover = mqNoHover.matches;
      const touch =
        "ontouchstart" in window || (navigator as any).maxTouchPoints > 0;
      setIsCoarsePointer(coarse || noHover || touch);
    };
    update();
    mqCoarse.addEventListener?.("change", update);
    mqNoHover.addEventListener?.("change", update);
    return () => {
      mqCoarse.removeEventListener?.("change", update);
      mqNoHover.removeEventListener?.("change", update);
    };
  }, []);

  const [rerenderTick] = useState(0);
  const markersKey = useMemo(() => {
    return [...markers]
      .map(
        (m) =>
          `${String(m.id)}:${m.position.lat.toFixed(
            6
          )},${m.position.lng.toFixed(6)}`
      )
      .sort()
      .join("|");
  }, [markers]);
  const realMarkersKey = useMemo(
    () => `${markersKey}_${rerenderTick}`,
    [markersKey, rerenderTick]
  );
  const selectedKey = useMemo(
    () => (hideLabelForId == null ? null : String(hideLabelForId)),
    [hideLabelForId]
  );

  const markerObjsRef = useRef<Record<string, any>>({});
  const markerClickHandlersRef = useRef<
    Record<string, ((...args: any[]) => void) | null>
  >({});
  const labelOvRef = useRef<Record<string, any>>({});
  const hitboxOvRef = useRef<Record<string, any>>({});
  const clustererRef = useRef<any>(null);

  const onMarkerClickRef = useRef<typeof onMarkerClick>();
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const preloadedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!kakao || !map) return;
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
  }, [kakao, map, realMarkersKey, defaultPinKind]);

  const prevSelectedIdRef = useRef<string | null>(null);
  const safeLabelMax = Math.min(labelMaxLevel, clusterMinLevel - 1);

  const mountClusterMode = (selId: string | null) => {
    const entries = Object.entries(markerObjsRef.current) as [string, any][];
    const mkList = entries.map(([, mk]) => mk);

    (Object.values(labelOvRef.current) as any[]).forEach((ov) =>
      ov.setMap(null)
    );
    (Object.values(hitboxOvRef.current) as any[]).forEach((ov) =>
      ov.setMap(null)
    );

    clustererRef.current?.clear?.();

    const exclude = new Set<string>();
    if (selId) exclude.add(selId);
    exclude.add(DRAFT_ID);

    const rest = entries.filter(([id]) => !exclude.has(id)).map(([, mk]) => mk);
    if (rest.length) clustererRef.current?.addMarkers?.(rest);

    if (selId) {
      const sel = markerObjsRef.current[selId];
      try {
        clustererRef.current?.removeMarker?.(sel);
      } catch {}
      sel?.setMap?.(map);
      sel?.setZIndex?.(1000);
    }
    const draftMk = markerObjsRef.current[DRAFT_ID];
    if (draftMk) {
      try {
        clustererRef.current?.removeMarker?.(draftMk);
      } catch {}
      draftMk.setMap(map);
      draftMk.setZIndex(1100);
    }
    mkList.forEach((mk) => mk.setMap?.(null));
    clustererRef.current?.redraw?.();
  };

  // 1) 클러스터러 초기화
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

  // 2) 마커/라벨/히트박스 생성
  useEffect(() => {
    if (!kakao || !map) return;

    // 정리
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

    markers.forEach((m) => {
      const key = String(m.id);
      const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);
      const isDraft = key === DRAFT_ID;

      const mkOptions: any = {
        position: pos,
        title: isDraft ? "답사예정" : m.title ?? key,
        zIndex: key === DRAFT_ID ? Z.DRAFT_PIN : 0,
      };

      const kind: PinKind = ((m as any).kind ?? defaultPinKind) as PinKind;
      const iconUrl = getPinUrl(kind);
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
        } catch {}
      }

      const mk = new kakao.maps.Marker(mkOptions);
      markerObjsRef.current[key] = mk;

      const handler = () => onMarkerClickRef.current?.(key);
      kakao.maps.event.addListener(mk, "click", handler);
      markerClickHandlersRef.current[key] = handler;

      // 라벨
      const labelEl = document.createElement("div");
      labelEl.className = "kakao-label";
      labelEl.innerText = isDraft ? "답사예정" : m.title ?? key;
      applyLabelStyles(labelEl, labelGapPx);
      labelEl.style.color = "#FFFFFF";
      labelEl.style.visibility = "visible";
      labelEl.style.display = "";

      const labelOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: labelEl,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: LABEL.Z_INDEX,
      });
      labelOvRef.current[key] = labelOv;

      // ✅ 히트박스 (터치 디바이스에서는 비활성화)
      const hitEl = document.createElement("div");
      hitEl.className = "kakao-hitbox";
      applyHitboxStyles(hitEl, hitboxSizePx);
      // ✅ 드래그 간섭 방지: 항상 패스스루
      hitEl.style.pointerEvents = "none";

      const hitOv = new kakao.maps.CustomOverlay({
        position: pos,
        content: hitEl,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: HITBOX.Z_INDEX,
        clickable: false,
      });
      hitboxOvRef.current[key] = hitOv;
    });

    // 초기 모드
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
        clustererRef.current?.clear?.();
        mkList.forEach((mk) => mk.setMap(map));
        const cleared = selectedKey == null;
        labelEntries.forEach(([id, ov]) =>
          ov.setMap(!cleared && id === selectedKey ? null : map)
        );
        // ✅ 터치면 히트박스 숨김
        hitEntries.forEach(([, ov]) => ov.setMap(null));
        if (!cleared) markerObjsRef.current[selectedKey!]?.setZIndex?.(1000);
        return;
      }

      if (level >= clusterMinLevel) {
        mountClusterMode(selectedKey);
        return;
      }

      // 중간 모드
      (Object.values(labelOvRef.current) as any[]).forEach((ov) =>
        ov.setMap(null)
      );
      clustererRef.current?.clear?.();
      mkList.forEach((mk) => mk.setMap(map));
      (Object.entries(hitboxOvRef.current) as [string, any][]).forEach(
        ([, ov]) => ov.setMap(null)
      );
    };

    applyMode();

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
    realMarkersKey,
    safeLabelMax,
    clusterMinLevel,
    labelGapPx,
    hitboxSizePx,
    defaultPinKind,
    isCoarsePointer, // ← 포인터 환경 바뀌면 히트박스 정책 재적용
  ]);

  // 2.5) fitToMarkers
  useEffect(() => {
    if (!kakao || !map) return;
    if (!fitToMarkers || !markers.length) return;
    const bounds = new kakao.maps.LatLngBounds();
    markers.forEach((m) =>
      bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng))
    );
    map.setBounds(bounds);
  }, [kakao, map, fitToMarkers, realMarkersKey]);

  // 3) 줌 변화에 따른 표시 모드 (히트박스는 터치면 숨김)
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
        const cleared = selectedKey == null;
        labelEntries.forEach(([id, ov]) =>
          ov.setMap(!cleared && id === selectedKey ? null : map)
        );
        hitEntries.forEach(([, ov]) => ov.setMap(null));
        if (!cleared) markerObjsRef.current[selectedKey!]?.setZIndex?.(1000);
        return;
      }

      if (level >= clusterMinLevel) {
        mountClusterMode(selectedKey);
        return;
      }

      labelEntries.forEach(([, ov]) => ov.setMap(null));
      clustererRef.current?.clear?.();
      mkList.forEach((mk) => mk.setMap(map));
      hitEntries.forEach(([, ov]) => ov.setMap(null));
    };

    kakao.maps.event.addListener(map, "zoom_changed", applyMode);
    applyMode();
    return () => {
      kakao?.maps?.event?.removeListener?.(map, "zoom_changed", applyMode);
    };
  }, [kakao, map, safeLabelMax, clusterMinLevel, selectedKey, isCoarsePointer]);

  // 4) 선택 변경 시 (히트박스는 터치면 숨김)
  useEffect(() => {
    if (!kakao || !map) return;

    const level = map.getLevel();
    const prevId = prevSelectedIdRef.current;

    if (level <= safeLabelMax) {
      const labelEntries = Object.entries(labelOvRef.current) as [
        string,
        any
      ][];
      labelEntries.forEach(([id, ov]) =>
        ov.setMap(selectedKey && id === selectedKey ? null : map)
      );

      const hitEntries = Object.entries(hitboxOvRef.current) as [string, any][];
      hitEntries.forEach(([, ov]) => ov.setMap(null));

      // 이전 선택 라벨만 복구 (히트박스 복구는 제거)
      if (prevId && prevId !== selectedKey) {
        labelOvRef.current[prevId]?.setMap(map);
      }

      // 선택된 마커는 앞으로
      if (selectedKey) {
        const mk = markerObjsRef.current[selectedKey];
        mk?.setMap?.(map);
        mk?.setZIndex?.(1000);
      }

      prevSelectedIdRef.current = selectedKey;
      return;
    }

    if (level >= clusterMinLevel) {
      const clusterer = clustererRef.current;
      if (prevId && prevId !== selectedKey) {
        const prevMk = markerObjsRef.current[prevId];
        try {
          prevMk?.setMap?.(null);
          clusterer?.addMarker?.(prevMk);
        } catch {}
      }
      if (selectedKey) {
        const sel = markerObjsRef.current[selectedKey];
        try {
          clusterer?.removeMarker?.(sel);
        } catch {}
        sel?.setMap?.(map);
        sel?.setZIndex?.(1000);
      }

      const draftMk = markerObjsRef.current[DRAFT_ID];
      if (draftMk) {
        try {
          clusterer?.removeMarker?.(draftMk);
        } catch {}
        draftMk.setMap(map);
        draftMk.setZIndex(1100);
      }

      clusterer?.redraw?.();
      prevSelectedIdRef.current = selectedKey;
      return;
    }

    prevSelectedIdRef.current = selectedKey;
  }, [kakao, map, selectedKey, safeLabelMax, clusterMinLevel, isCoarsePointer]);

  // 5) 말풍선 닫힐 때 라벨/히트박스 복구 (라벨 모드에서만)
  useEffect(() => {
    if (!kakao || !map) return;
    if (selectedKey != null) return;
    const level = map.getLevel();
    if (level > safeLabelMax) return;
    const labels = Object.values(labelOvRef.current) as any[];
    labels.forEach((ov) => ov.setMap(map));
  }, [selectedKey, kakao, map, safeLabelMax, isCoarsePointer]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPointerDown = (e: PointerEvent) => {
      const next = e.pointerType === "touch" || e.pointerType === "pen";
      setIsCoarsePointer((prev) => (prev !== next ? next : prev));
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);
}

export default useClustererWithLabels;
