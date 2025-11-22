export const NEAR_THRESHOLD_M = 35;
export const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
export const DEFAULT_LEVEL = 4;

export const PIN_MARKER = {
  size: { w: 36, h: 48 },
  offset: { x: 18, y: 48 }, // 바늘 끝이 좌표에 닿도록
} as const;

export const LABEL = {
  GAP_PX: 12,
  FONT_SIZE: 12,
  Z_INDEX: 10000,
} as const;

export const HITBOX = {
  DIAMETER_PX: 48,
  Z_INDEX: 20000,
} as const;

export const Z = {
  DRAFT_PIN: 101,
} as const;

export const KOREA_BOUNDS = {
  sw: { lat: 33.0, lng: 124.0 },
  ne: { lat: 39.5, lng: 132.0 },
} as const;
