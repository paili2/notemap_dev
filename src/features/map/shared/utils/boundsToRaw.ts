import { Bounds } from "../types/bounds";

export function boundsToRaw(b?: kakao.maps.LatLngBounds): Bounds | undefined {
  if (!b) return undefined;
  const sw = b.getSouthWest();
  const ne = b.getNorthEast();
  return {
    swLat: sw.getLat(),
    swLng: sw.getLng(),
    neLat: ne.getLat(),
    neLng: ne.getLng(),
  };
}
