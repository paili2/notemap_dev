"use client";

import { boundsToRaw } from "@/features/map/lib/bounds";
import type { Bounds } from "@/features/map/types/bounds";
import { useBounds } from "../../hooks/useBounds";

// Bounds(raw) 반환
export function useBoundsRaw(
  kakaoSDK?: typeof kakao,
  mapInstance?: kakao.maps.Map | null
) {
  const getLLB = useBounds(kakaoSDK, mapInstance);
  return (): Bounds | undefined => boundsToRaw(getLLB());
}
