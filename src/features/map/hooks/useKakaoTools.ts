import { useCallback } from "react";
import { LatLng } from "../types/map";

export function useResolveAddress(kakaoSDKRef?: any) {
  return useCallback(
    async (latlng: LatLng) => {
      try {
        const kakao =
          (typeof window !== "undefined" ? (window as any).kakao : null) ??
          kakaoSDKRef;
        if (!kakao) return { road: null, jibun: null };

        const geocoder = new kakao.maps.services.Geocoder();
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
    },
    [kakaoSDKRef]
  );
}

export function usePanToWithOffset(kakaoSDK: any, mapInstance: any) {
  return useCallback(
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
}
