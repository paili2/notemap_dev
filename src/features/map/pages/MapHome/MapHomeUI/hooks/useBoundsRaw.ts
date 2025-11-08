"use client";

import type { Bounds } from "@/features/map/shared/types/bounds";
import { useBounds } from "../../hooks/useBounds";
import { boundsToRaw } from "@/features/map/shared/utils/boundsToRaw";

// Bounds(raw) 반환
export function useBoundsRaw(
  kakaoSDK?: typeof kakao,
  mapInstance?: kakao.maps.Map | null
) {
  const getLLB = useBounds(kakaoSDK, mapInstance);
  return (): Bounds | undefined => boundsToRaw(getLLB());
}
