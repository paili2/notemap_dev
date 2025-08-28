// src/lib/geo/nearest.ts
import { distanceMeters, LatLng } from "./distance";

export type MarkerLike = Readonly<{
  id: string;
  position: LatLng; // { lat, lng }
}>;

/**
 * 타겟 좌표에서 가장 가까운 마커를 찾고,
 * 그 거리가 maxMeters 이하면 { marker, dist }를 반환. 아니면 null.
 */
export function findNearestMarker(
  target: LatLng,
  markers: ReadonlyArray<MarkerLike>,
  maxMeters = 30
): { marker: MarkerLike; dist: number } | null {
  if (!markers || markers.length === 0) return null;

  // 좌표 유효성
  if (!Number.isFinite(target.lat) || !Number.isFinite(target.lng)) return null;

  let bestIdx = -1;
  let bestDist = Infinity;

  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    const p = m.position;
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;

    const d = distanceMeters(target, p);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  if (bestIdx === -1) return null;
  if (bestDist <= maxMeters) {
    return { marker: markers[bestIdx]!, dist: bestDist };
  }
  return null;
}
