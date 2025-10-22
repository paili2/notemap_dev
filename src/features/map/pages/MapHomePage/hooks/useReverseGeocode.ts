import { useCallback } from "react";

export function useReverseGeocode(kakaoSDK: any) {
  return useCallback(
    async (lat: number, lng: number) => {
      const K = kakaoSDK;
      if (!K?.maps?.services)
        return { road: null as string | null, jibun: null as string | null };
      const geocoder = new K.maps.services.Geocoder();
      return await new Promise<{ road: string | null; jibun: string | null }>(
        (resolve) => {
          // Kakao는 (lng, lat) 순서
          geocoder.coord2Address(lng, lat, (result: any[], status: string) => {
            if (
              status !== K.maps.services.Status.OK ||
              !Array.isArray(result) ||
              result.length === 0
            ) {
              resolve({ road: null, jibun: null });
              return;
            }
            const r = result[0];
            const road = r.road_address?.address_name ?? null;
            const jibun = r.address?.address_name ?? null;
            resolve({ road, jibun });
          });
        }
      );
    },
    [kakaoSDK]
  );
}
