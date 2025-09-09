"use client";

import { useCallback, useState } from "react";
import type { LatLng } from "@/features/map/types/map";

export function useKakaoCore() {
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const panToWithOffset = useCallback(
    (latlng: LatLng, offsetY = 180, offsetX = 0) => {
      if (!kakaoSDK || !mapInstance) return;
      const pos = new kakaoSDK.maps.LatLng(latlng.lat, latlng.lng);
      const proj = mapInstance.getProjection();
      const pt = proj.pointFromCoords(pos);
      const target = proj.coordsFromPoint(
        new kakaoSDK.maps.Point(pt.x + offsetX, pt.y - offsetY)
      );
      mapInstance.panTo(target);
    },
    [kakaoSDK, mapInstance]
  );

  return {
    kakaoSDK,
    mapInstance,
    setKakaoSDK,
    setMapInstance,
    panToWithOffset,
  };
}
