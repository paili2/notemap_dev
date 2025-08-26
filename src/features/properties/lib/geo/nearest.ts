// src/lib/geo/nearest.ts
import { distanceMeters, LatLng } from "./distance";

export type MarkerLike = {
  id: string;
  position: LatLng; // { lat, lng }
};

export function findNearestMarker(
  target: LatLng,
  markers: MarkerLike[],
  maxMeters = 30 // ✅ 임계값: 30m 이내면 같은 장소로 판단
) {
  if (!markers?.length) return null;

  let best: { marker: MarkerLike; dist: number } | null = null;

  for (const m of markers) {
    const d = distanceMeters(target, m.position);
    if (!best || d < best.dist) best = { marker: m, dist: d };
  }

  if (best && best.dist <= maxMeters) return best; // { marker, dist }
  return null;
}
