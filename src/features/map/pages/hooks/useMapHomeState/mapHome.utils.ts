import type { LatLng } from "@/lib/geo/types";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { ViewSource } from "@/features/properties/lib/view/types";
import type { Viewport } from "./mapHome.types";

export const PIN_MENU_MAX_LEVEL = 5;
export const DRAFT_PIN_STORAGE_KEY = "maphome:draftPin";

/** 부동소수점 비교 오차 보정 */
export const sameCoord = (a?: LatLng | null, b?: LatLng | null, eps = 1e-7) =>
  !!a && !!b && Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;

export const sameViewport = (
  a?: Viewport | null,
  b?: Viewport | null,
  eps = 1e-7
) => {
  if (!a || !b) return false;
  const eq = (p: LatLng, q: LatLng) =>
    Math.abs(p.lat - q.lat) < eps && Math.abs(p.lng - q.lng) < eps;
  return (
    a.zoomLevel === b.zoomLevel &&
    eq(a.leftTop, b.leftTop) &&
    eq(a.leftBottom, b.leftBottom) &&
    eq(a.rightTop, b.rightTop) &&
    eq(a.rightBottom, b.rightBottom)
  );
};

/** Kakao LatLng 객체/POJO 모두 대응 정규화 */
export function normalizeLL(v: any): LatLng {
  if (v && typeof v.getLat === "function" && typeof v.getLng === "function") {
    return { lat: v.getLat(), lng: v.getLng() };
  }
  return { lat: Number(v?.lat), lng: Number(v?.lng) };
}

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
