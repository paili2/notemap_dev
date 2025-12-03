import type { LatLng } from "@/lib/geo/types";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { ViewSource } from "@/features/properties/lib/view/types";
import type { Viewport } from "./mapHome.types";

export const PIN_MENU_MAX_LEVEL = 5;
export const DRAFT_PIN_STORAGE_KEY = "maphome:draftPin";

/** Kakao LatLng 객체/POJO 모두 대응 정규화 */
export function normalizeLL(v: unknown): LatLng | null {
  if (!v) return null;

  // kakao.maps.LatLng 인스턴스
  if (
    typeof (v as any).getLat === "function" &&
    typeof (v as any).getLng === "function"
  ) {
    const lat = (v as any).getLat();
    const lng = (v as any).getLng();
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  // { lat, lng } 형태
  const lat = Number((v as any)?.lat);
  const lng = Number((v as any)?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** 부동소수점 비교 오차 보정 (LatLng | kakao.LatLng 모두 처리) */
export const sameCoord = (
  a?: LatLng | { lat: number; lng: number } | null,
  b?: LatLng | { lat: number; lng: number } | null,
  eps = 1e-7
): boolean => {
  if (!a || !b) return false;

  const aa = normalizeLL(a);
  const bb = normalizeLL(b);
  if (!aa || !bb) return false;

  return Math.abs(aa.lat - bb.lat) < eps && Math.abs(aa.lng - bb.lng) < eps;
};

export const sameViewport = (
  a?: Viewport | null,
  b?: Viewport | null,
  eps = 1e-7
): boolean => {
  if (!a || !b) return false;

  return (
    a.zoomLevel === b.zoomLevel &&
    sameCoord(a.leftTop, b.leftTop, eps) &&
    sameCoord(a.leftBottom, b.leftBottom, eps) &&
    sameCoord(a.rightTop, b.rightTop, eps) &&
    sameCoord(a.rightBottom, b.rightBottom, eps)
  );
};

/** PropertyItem -> ViewSource (얇은 어댑터) */
export function toViewSourceFromPropertyItem(p: PropertyItem): ViewSource {
  const anyP = p as any;
  return {
    title: p.title,
    address:
      (anyP.address && String(anyP.address)) ||
      (anyP.addressLine && String(anyP.addressLine)) ||
      undefined,
    status: anyP.status ?? null,
    dealStatus: anyP.dealStatus ?? null,
    type: anyP.type ?? null,
    priceText: anyP.priceText ?? null,
    view: anyP.view ?? undefined,
  };
}
