// MapHomeUI/lib/viewUtils.ts

import { PropertyViewDetails } from "@/features/properties/components/modals/PropertyViewModal/types";

/* 🔍 사이드바 → 지도 포커스 공통 레벨 */
export const TARGET_FOCUS_LEVEL = 4;

type FocusArgs = {
  kakaoSDK: any;
  mapInstance: any;
  lat: number;
  lng: number;
  level?: number;
};

/**
 * 주어진 좌표로 지도 포커스 + 레벨 맞추기
 */
export function focusMapToPosition({
  kakaoSDK,
  mapInstance,
  lat,
  lng,
  level = TARGET_FOCUS_LEVEL,
}: FocusArgs) {
  if (!kakaoSDK || !mapInstance) return;

  try {
    const ll = new kakaoSDK.maps.LatLng(lat, lng);
    const current = mapInstance.getLevel?.();

    if (typeof current === "number" && current !== level) {
      mapInstance.setLevel(level, { animate: true });
    }

    mapInstance.panTo(ll);
  } catch (e) {
    console.error("[focusMapToPosition] map 이동 실패:", e);
  }
}

/**
 * 뷰 모달에서 항상 editInitial.view 가 들어있도록 보정
 */
export function ensureViewForEdit(
  v: PropertyViewDetails | (PropertyViewDetails & { editInitial?: any }) | null
): (PropertyViewDetails & { editInitial: any }) | null {
  if (!v) return null;

  const id = (v as any).id ?? (v as any)?.view?.id ?? undefined;
  const view = { ...(v as any), ...(id != null ? { id } : {}) };

  if ((view as any).editInitial?.view) {
    return view as any;
  }
  return {
    ...(view as any),
    editInitial: { view: { ...(view as any) } },
  } as any;
}
