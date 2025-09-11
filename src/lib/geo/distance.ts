import type { LatLng } from "./types";

export const EARTH_RADIUS_M = 6_371_000; // m
const DEG2RAD = Math.PI / 180;

/** 두 좌표 사이 하버사인 거리(m) */
export function distanceMeters(a: LatLng, b: LatLng): number {
  if (a.lat === b.lat && a.lng === b.lng) return 0;

  const lat1 = a.lat * DEG2RAD;
  const lat2 = b.lat * DEG2RAD;
  const dLat = (b.lat - a.lat) * DEG2RAD;
  const dLng = (b.lng - a.lng) * DEG2RAD;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  // 부동소수 오차 보호
  const s = Math.min(
    1,
    Math.max(
      0,
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
    )
  );

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return EARTH_RADIUS_M * c;
}

/** 근사식(소거리 고속): ~100km 이하 */
export function approxDistanceMeters(a: LatLng, b: LatLng): number {
  const meanLat = ((a.lat + b.lat) / 2) * DEG2RAD;
  const x = (b.lng - a.lng) * DEG2RAD * Math.cos(meanLat);
  const y = (b.lat - a.lat) * DEG2RAD;
  return Math.sqrt(x * x + y * y) * EARTH_RADIUS_M;
}

export function distanceKm(a: LatLng, b: LatLng): number {
  return distanceMeters(a, b) / 1000;
}
