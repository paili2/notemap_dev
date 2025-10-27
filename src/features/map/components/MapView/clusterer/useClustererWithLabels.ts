"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import type { MapMarker } from "@/features/map/types/map";
import type { PinKind } from "@/features/pins/types";
import { LABEL, HITBOX } from "@/features/map/lib/constants";
import { useSidebar } from "@/features/sidebar";
import type { ClustererWithLabelsOptions, RefsBag } from "./types";
import { usePreloadIcons } from "./effects/usePreloadIcons";
import { useInitClusterer } from "./effects/useInitClusterer";
import { useRebuildScene } from "./effects/useRebuildScene";
import { useFitBounds } from "./effects/useFitBounds";
import { useZoomModeSwitch } from "./effects/useZoomModeSwitch";
import { useSelectionEffect } from "./effects/useSelectionEffect";
import { useRestoreClosedBubbles } from "./effects/useRestoreClosedBubbles";
import { useUpdateZIndexAndLabels } from "./effects/useUpdateZIndexAndLabels";

type Opts = ClustererWithLabelsOptions & { enableDebug?: boolean };

export function useClustererWithLabels(
  kakao: any,
  map: any,
  markers: readonly MapMarker[],
  {
    labelMaxLevel = 5,
    clusterMinLevel = 6,
    onMarkerClick,
    fitToMarkers = false,
    labelGapPx = LABEL.GAP_PX,
    hitboxSizePx = HITBOX.DIAMETER_PX,
    defaultPinKind = "1room",
    hideLabelForId = null,
    enableDebug = false,
  }: Opts = {}
) {
  const { reservationOrderMap = {}, reservationOrderByPosKey = {} } =
    useSidebar();

  const isClient = typeof window !== "undefined";
  const isReady = isClient && !!kakao?.maps && !!map;

  const [rerenderTick, setRerenderTick] = useState(0);

  const markersKey = useMemo(() => {
    return [...markers]
      .map((m) => {
        const label = (m as any).name ?? m.title ?? "";
        return `${String(m.id)}:${m.position.lat.toFixed(
          6
        )},${m.position.lng.toFixed(6)}:${label}`;
      })
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
    Record<string, ((...a: any[]) => void) | null>
  >({});
  const labelOvRef = useRef<Record<string, any>>({});
  const hitboxOvRef = useRef<Record<string, any>>({});
  const clustererRef = useRef<any>(null);

  const onMarkerClickRef = useRef<typeof onMarkerClick>();
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const safeLabelMax = Math.max(
    0,
    Math.min(labelMaxLevel, clusterMinLevel - 1)
  );

  useEffect(() => {
    if (!markerObjsRef.current) markerObjsRef.current = {};
    if (!markerClickHandlersRef.current) markerClickHandlersRef.current = {};
    if (!labelOvRef.current) labelOvRef.current = {};
    if (!hitboxOvRef.current) hitboxOvRef.current = {};
  }, [isReady, realMarkersKey]);

  // (옵션) 클릭 막는 UI가 있을 때 대비한 스타일 패치
  useEffect(() => {
    if (!enableDebug || !isClient) return;
    const id = "kakao-pin-pointer-patch";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .pin-label { pointer-events: none; user-select: none; }
      .pin-hitbox { pointer-events: none; user-select: none; }
    `;
    document.head.appendChild(style);
    return () => {
      try {
        style.remove();
      } catch {}
    };
  }, [enableDebug, isClient]);

  usePreloadIcons(isReady, markers, defaultPinKind as PinKind, realMarkersKey);
  useInitClusterer(isReady, kakao, map, clustererRef, clusterMinLevel);

  // 클러스터 클릭 확대 동작은 기본 유지
  useEffect(() => {
    if (!isReady || !clustererRef.current) return;
    try {
      if (typeof clustererRef.current.setDisableClickZoom === "function") {
        clustererRef.current.setDisableClickZoom(false);
      }
    } catch {}
  }, [isReady, realMarkersKey]);

  useRebuildScene({
    isReady,
    kakao,
    map,
    markers,
    reservationOrderMap,
    reservationOrderByPosKey,
    defaultPinKind: defaultPinKind as PinKind,
    labelGapPx,
    hitboxSizePx,
    safeLabelMax,
    clusterMinLevel,
    selectedKey,
    realMarkersKey,
    markerObjsRef,
    markerClickHandlersRef,
    labelOvRef,
    hitboxOvRef,
    clustererRef,
    onMarkerClickRef,
  });

  useFitBounds(isReady, kakao, map, markers, fitToMarkers, realMarkersKey);

  const refs: RefsBag = {
    markerObjsRef,
    markerClickHandlersRef,
    labelOvRef,
    hitboxOvRef,
    clustererRef,
    onMarkerClickRef,
  };

  useZoomModeSwitch(
    isReady,
    kakao,
    map,
    refs,
    selectedKey,
    safeLabelMax,
    clusterMinLevel
  );
  useSelectionEffect(
    isReady,
    kakao,
    map,
    selectedKey,
    safeLabelMax,
    clusterMinLevel,
    clustererRef,
    labelOvRef,
    hitboxOvRef,
    markerObjsRef
  );
  useRestoreClosedBubbles(
    isReady,
    map,
    selectedKey,
    safeLabelMax,
    labelOvRef,
    hitboxOvRef
  );

  useUpdateZIndexAndLabels(
    isReady,
    reservationOrderMap,
    selectedKey,
    markerObjsRef,
    labelOvRef
  );

  // 🔒 프로덕션: 세이프티 리스너 비활성 (디버그시에만 부착)
  useEffect(() => {
    if (!enableDebug || !isReady) return;
    const entries = Object.entries(markerObjsRef.current || {});
    if (!entries.length) return;

    entries.forEach(([key, marker]) => {
      try {
        if (typeof marker.setClickable === "function") {
          marker.setClickable(true);
        }
        if (!(marker as any).__dbg_click_bound) {
          (marker as any).__dbg_click_bound = true;
          kakao.maps.event.addListener(marker, "click", () => {
            // eslint-disable-next-line no-console
            console.log("[DBG] marker clicked:", key);
            onMarkerClickRef.current?.(key);
          });
        }
      } catch {}
    });
  }, [enableDebug, isReady, realMarkersKey, kakao]);

  return {
    redraw: () => clustererRef.current?.redraw?.(),
    clear: () => clustererRef.current?.clear?.(),
    forceRemount: () => {
      clustererRef.current?.clear?.();
      clustererRef.current?.redraw?.();
      markerObjsRef.current = {};
      markerClickHandlersRef.current = {};
      labelOvRef.current = {};
      hitboxOvRef.current = {};
      setRerenderTick((t) => t + 1);
    },
  };
}

export default useClustererWithLabels;
