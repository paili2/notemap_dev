// 지도 클릭 이벤트

"use client";

import { useEffect, useRef } from "react";
import type { LatLng } from "@/features/properties/types/map";

export function useMapClick(
  kakao: any,
  map: any,
  onMapClick?: (latlng: LatLng) => void
) {
  const clickListenerRef = useRef<any>(null);

  useEffect(() => {
    if (!kakao || !map) return;

    if (clickListenerRef.current) {
      kakao.maps.event.removeListener(map, "click", clickListenerRef.current);
      clickListenerRef.current = null;
    }

    if (onMapClick) {
      const handler = (e: any) => {
        const latlng = e?.latLng;
        if (!latlng) return;
        onMapClick({ lat: latlng.getLat(), lng: latlng.getLng() });
      };
      kakao.maps.event.addListener(map, "click", handler);
      clickListenerRef.current = handler;
    }

    return () => {
      if (clickListenerRef.current) {
        kakao.maps.event.removeListener(map, "click", clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, [kakao, map, onMapClick]);
}
