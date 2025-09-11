"use client";

import { LatLng } from "@/lib/geo/types";
import { useCallback, useRef } from "react";

export function useResolveAddress() {
  const geocoderRef = useRef<any>(null);

  const resolveAddress = useCallback(async (latlng: LatLng) => {
    try {
      const kakao = (window as any).kakao;
      if (!kakao) return { road: null, jibun: null };

      if (!geocoderRef.current)
        geocoderRef.current = new kakao.maps.services.Geocoder();
      const geocoder = geocoderRef.current as any;
      const coord = new kakao.maps.LatLng(latlng.lat, latlng.lng);

      const result = await new Promise<{
        road: string | null;
        jibun: string | null;
      }>((resolve) => {
        geocoder.coord2Address(
          coord.getLng(),
          coord.getLat(),
          (res: any[], status: any) => {
            if (status === kakao.maps.services.Status.OK && res?.[0]) {
              const r0 = res[0];
              resolve({
                road: r0.road_address?.address_name ?? null,
                jibun: r0.address?.address_name ?? null,
              });
            } else {
              resolve({ road: null, jibun: null });
            }
          }
        );
      });

      return result;
    } catch {
      return { road: null, jibun: null };
    }
  }, []);

  return { resolveAddress };
}
