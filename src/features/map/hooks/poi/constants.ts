"use client";

import { PoiKind } from "@/features/map/components/overlays/poiOverlays";

export const DEFAULTS = {
  maxResultsPerKind: 80,
  minViewportEdgeMeters: 250, // (시그니처 호환용)
  showAtOrBelowLevel: 999, // (시그니처 호환용)
} as const;

export const IDLE_THROTTLE_MS = 500;

/** 항상 레벨 3(≈50m)에서만 보이게 */
export const VISIBLE_MAX_LEVEL = 3;

/** 스케일바 기반 보조 게이트 */
export const SCALEBAR_PX = 100;
export const DESIRED_SCALEBAR_M = 400;

/** 중심 근처 우선 채우기 */
export const NEAR_RATIO = 0.6;

export const RADIUS_BY_KIND: Record<PoiKind, number> = {
  convenience: 800,
  cafe: 800,
  pharmacy: 1000,
  subway: 1500,
  school: 1000,
};
