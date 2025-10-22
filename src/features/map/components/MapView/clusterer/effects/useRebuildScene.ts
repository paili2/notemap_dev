"use client";

import { useEffect } from "react";
import type { MapMarker } from "@/features/map/types/map";
import type { PinKind } from "@/features/pins/types";
import { DRAFT_ID, SELECTED_Z } from "../style";
import {
  createMarker,
  createLabelOverlay,
  createHitboxOverlay,
} from "../overlays";
import { mountClusterMode } from "../controller";

type Args = {
  isReady: boolean;
  kakao: any;
  map: any;
  markers: readonly MapMarker[];
  reservationOrderMap: Record<string, number | undefined> | undefined;
  defaultPinKind: PinKind;
  labelGapPx: number;
  hitboxSizePx: number;
  safeLabelMax: number;
  clusterMinLevel: number;
  selectedKey: string | null;
  realMarkersKey: string; // 키 변경 시 재생성
  // refs
  markerObjsRef: React.MutableRefObject<Record<string, any>>;
  markerClickHandlersRef: React.MutableRefObject<
    Record<string, ((...a: any[]) => void) | null>
  >;
  labelOvRef: React.MutableRefObject<Record<string, any>>;
  hitboxOvRef: React.MutableRefObject<Record<string, any>>;
  clustererRef: React.MutableRefObject<any>;
  onMarkerClickRef: React.MutableRefObject<((id: string) => void) | undefined>;
};

export function useRebuildScene(args: Args) {
  const {
    isReady,
    kakao,
    map,
    markers,
    reservationOrderMap,
    defaultPinKind,
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
  } = args;

  useEffect(() => {
    if (!isReady) return;

    // cleanup old
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

    // create fresh
    markers.forEach((m: any) => {
      const key = String(m.id);
      const pos = new kakao.maps.LatLng(m.position.lat, m.position.lng);
      const order = reservationOrderMap?.[key] ?? null;
      const isDraft = key === DRAFT_ID;

      const mk = createMarker(kakao, pos, {
        isDraft,
        key,
        kind: (m.kind ?? defaultPinKind) as PinKind,
        title: m.title ?? key,
      });
      markerObjsRef.current[key] = mk;

      if (!isDraft) {
        const BASE_Z = 1000;
        const z = order ? BASE_Z + (1000 - order) : BASE_Z;
        try {
          mk.setZIndex(z);
        } catch {}
      }

      const handler = () => onMarkerClickRef.current?.(key);
      kakao.maps.event.addListener(mk, "click", handler);
      markerClickHandlersRef.current[key] = handler;

      const labelText = isDraft ? "답사예정" : m.title ?? key;
      const labelOv = createLabelOverlay(
        kakao,
        pos,
        labelText,
        labelGapPx,
        order
      );
      labelOvRef.current[key] = labelOv;

      const hitOv = createHitboxOverlay(kakao, pos, hitboxSizePx, () =>
        onMarkerClickRef.current?.(key)
      );
      hitboxOvRef.current[key] = hitOv;
    });

    // initial mode
    const level = map.getLevel();
    if (level <= safeLabelMax) {
      clustererRef.current?.clear?.();
      Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(map));
      const cleared = selectedKey == null;
      Object.entries(labelOvRef.current).forEach(([id, ov]: any[]) =>
        ov.setMap(!cleared && id === selectedKey ? null : map)
      );
      Object.entries(hitboxOvRef.current).forEach(([id, ov]: any[]) =>
        ov.setMap(!cleared && id === selectedKey ? null : map)
      );
      if (!cleared)
        markerObjsRef.current[selectedKey!]?.setZIndex?.(SELECTED_Z);
    } else if (level >= clusterMinLevel) {
      mountClusterMode(
        { kakao, map },
        {
          markerObjsRef,
          markerClickHandlersRef,
          labelOvRef,
          hitboxOvRef,
          clustererRef,
          onMarkerClickRef,
        },
        selectedKey
      );
    } else {
      Object.values(labelOvRef.current).forEach((ov: any) => ov.setMap(null));
      clustererRef.current?.clear?.();
      Object.values(markerObjsRef.current).forEach((mk: any) => mk.setMap(map));
      Object.values(hitboxOvRef.current).forEach((ov: any) => ov.setMap(map));
    }

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
    // realMarkersKey가 바뀌면 재구성
  }, [
    isReady,
    realMarkersKey,
    kakao,
    map,
    reservationOrderMap,
    defaultPinKind,
    labelGapPx,
    hitboxSizePx,
    safeLabelMax,
    clusterMinLevel,
    selectedKey,
  ]);
}
