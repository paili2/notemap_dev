"use client";

import { useEffect } from "react";
import type { MapMarker } from "@/features/map/shared/types/mapMarker.type";

export function useFitBounds(
  isReady: boolean,
  kakao: any,
  map: any,
  markers: readonly MapMarker[],
  fitToMarkers: boolean,
  depsKey: string
) {
  useEffect(() => {
    if (!isReady) return;
    if (!fitToMarkers || !markers.length) return;

    const bounds = new kakao.maps.LatLngBounds();
    markers.forEach((m) =>
      bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng))
    );
    map.setBounds(bounds);
  }, [isReady, fitToMarkers, depsKey, kakao, map, markers]);
}
