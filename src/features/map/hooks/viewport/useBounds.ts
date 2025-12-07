"use client";

// kakao.maps.LatLngBounds 반환
export function useBounds(
  kakaoSDK?: typeof kakao,
  mapInstance?: kakao.maps.Map | null
) {
  return (): kakao.maps.LatLngBounds | undefined => {
    if (!kakaoSDK || !mapInstance) return undefined;
    const b: any = mapInstance.getBounds?.();
    if (!b) return undefined;

    // 이미 LatLngBounds 인스턴스면 그대로
    if (
      typeof b.getSouthWest === "function" &&
      typeof b.getNorthEast === "function" &&
      typeof b.extend === "function"
    ) {
      return b as kakao.maps.LatLngBounds;
    }

    // 혹시 sw/ne만 있는 형태일 때 보정
    const sw = b.getSouthWest?.() ?? b.sw;
    const ne = b.getNorthEast?.() ?? b.ne;
    if (!sw || !ne) return undefined;

    const swLL =
      sw instanceof kakaoSDK.maps.LatLng
        ? sw
        : new kakaoSDK.maps.LatLng(
            sw.getLat?.() ?? sw.lat,
            sw.getLng?.() ?? sw.lng
          );
    const neLL =
      ne instanceof kakaoSDK.maps.LatLng
        ? ne
        : new kakaoSDK.maps.LatLng(
            ne.getLat?.() ?? ne.lat,
            ne.getLng?.() ?? ne.lng
          );

    return new kakaoSDK.maps.LatLngBounds(swLL, neLL);
  };
}
