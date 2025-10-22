"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MapMarker } from "@/features/map/types/map";
import type { PinKind } from "@/features/pins/types";
import { LABEL, HITBOX } from "@/features/map/lib/constants";
import { useSidebar } from "@/features/sidebar";
import type { ClustererWithLabelsOptions, KakaoDeps, RefsBag } from "./types";
import { usePreloadIcons } from "./effects/usePreloadIcons";
import { useInitClusterer } from "./effects/useInitClusterer";
import { useRebuildScene } from "./effects/useRebuildScene";
import { useFitBounds } from "./effects/useFitBounds";
import { useZoomModeSwitch } from "./effects/useZoomModeSwitch";
import { useSelectionEffect } from "./effects/useSelectionEffect";
import { useRestoreClosedBubbles } from "./effects/useRestoreClosedBubbles";
import { useUpdateZIndexAndLabels } from "./effects/useUpdateZIndexAndLabels";

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
  }: ClustererWithLabelsOptions = {}
) {
  const { reservationOrderMap } = useSidebar();

  const isClient = typeof window !== "undefined";
  const isReady = isClient && !!kakao?.maps && !!map;

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
    Record<string, ((...a: any[]) => void) | null>
  >({});
  const labelOvRef = useRef<Record<string, any>>({});
  const hitboxOvRef = useRef<Record<string, any>>({});
  const clustererRef = useRef<any>(null);
  const onMarkerClickRef = useRef<typeof onMarkerClick>();
  useEffect(
    () => void (onMarkerClickRef.current = onMarkerClick),
    [onMarkerClick]
  );

  const safeLabelMax = Math.min(labelMaxLevel, clusterMinLevel - 1);

  // ── 분리된 효과들 호출 ─────────────────────────────────────────────
  usePreloadIcons(isReady, markers, defaultPinKind as PinKind, realMarkersKey);
  useInitClusterer(isReady, kakao, map, clustererRef, clusterMinLevel);
  useRebuildScene({
    isReady,
    kakao,
    map,
    markers,
    reservationOrderMap,
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

  return {
    redraw: () => clustererRef.current?.redraw?.(),
    clear: () => clustererRef.current?.clear?.(),
    forceRemount: () => {
      clustererRef.current?.clear?.();
      clustererRef.current?.redraw?.();
    },
  };
}

export default useClustererWithLabels;
