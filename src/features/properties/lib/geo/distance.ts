export type LatLng = Readonly<{ lat: number; lng: number }>;

export const EARTH_RADIUS_M = 6_371_000; // m
const DEG2RAD = Math.PI / 180;

/** 두 좌표 사이 하버사인 거리(m) */
export function distanceMeters(a: LatLng, b: LatLng): number {
  if (a.lat === b.lat && a.lng === b.lng) return 0;

  const φ1 = a.lat * DEG2RAD;
  const φ2 = b.lat * DEG2RAD;
  const Δφ = (b.lat - a.lat) * DEG2RAD;
  const Δλ = (b.lng - a.lng) * DEG2RAD;

  const sinΔφ = Math.sin(Δφ / 2);
  const sinΔλ = Math.sin(Δλ / 2);

  // s는 부동소수 오차로 1을 살짝 넘을 수 있어 clamp
  const s = Math.min(
    1,
    Math.max(0, sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ)
  );

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return EARTH_RADIUS_M * c;
}

/** km 단위가 필요할 때 편의 함수 */
export function distanceKm(a: LatLng, b: LatLng): number {
  return distanceMeters(a, b) / 1000;
}

/** 근사식(소거리 고속): ~100km 이하에서 빠르고 충분히 정확 */
export function approxDistanceMeters(a: LatLng, b: LatLng): number {
  const φm = ((a.lat + b.lat) / 2) * DEG2RAD; // 평균 위도
  const x = (b.lng - a.lng) * DEG2RAD * Math.cos(φm);
  const y = (b.lat - a.lat) * DEG2RAD;
  return Math.sqrt(x * x + y * y) * EARTH_RADIUS_M;
}
