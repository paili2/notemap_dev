export function isKakaoLatLng(
  _kakao: typeof window.kakao,
  v: unknown
): v is kakao.maps.LatLng {
  return (
    !!v &&
    typeof (v as any).getLat === "function" &&
    typeof (v as any).getLng === "function"
  );
}
export function isMarker(v: unknown): v is kakao.maps.Marker {
  return !!v && typeof (v as any).getPosition === "function";
}
export function isPlainLatLng(v: unknown): v is { lat: number; lng: number } {
  return (
    !!v &&
    typeof (v as any).lat === "number" &&
    typeof (v as any).lng === "number"
  );
}

/** target(마커/LatLng/{lat,lng}) → kakao.maps.LatLng */
export function toLatLng(
  kakaoSDK: typeof window.kakao,
  target: unknown
): kakao.maps.LatLng {
  if (isKakaoLatLng(kakaoSDK, target)) return target;
  if (isMarker(target)) return target.getPosition();
  if (isPlainLatLng(target))
    return new kakaoSDK.maps.LatLng(target.lat, target.lng);
  return new kakaoSDK.maps.LatLng(37.5665, 126.978);
}

/** 도로명 > 지번 > 타이틀 > 좌표 */
export function buildAddressLine(
  lat: number,
  lng: number,
  roadAddress?: string | null,
  jibunAddress?: string | null,
  title?: string | null
) {
  const pick = (v?: string | null) => (v && v.trim().length ? v.trim() : null);
  return (
    pick(roadAddress) ??
    pick(jibunAddress) ??
    pick(title) ??
    `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  );
}
