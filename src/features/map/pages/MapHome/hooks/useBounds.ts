export function useBounds(kakaoSDK: any, mapInstance: any) {
  return () => {
    if (!mapInstance || !kakaoSDK) return undefined;
    const b = mapInstance.getBounds?.();
    if (!b) return undefined;
    const sw = b.getSouthWest?.();
    const ne = b.getNorthEast?.();
    if (!sw || !ne) return undefined;
    return {
      swLat: sw.getLat(),
      swLng: sw.getLng(),
      neLat: ne.getLat(),
      neLng: ne.getLng(),
    };
  };
}
