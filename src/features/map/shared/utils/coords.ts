"use client";

export function normalizeLL(v: any): { lat: number; lng: number } {
  if (v && typeof v.getLat === "function" && typeof v.getLng === "function") {
    return { lat: v.getLat(), lng: v.getLng() };
  }
  return { lat: Number(v?.lat), lng: Number(v?.lng) };
}

export function toGroupingPosKeyFromPos(
  pos?: { lat: number; lng: number } | null
) {
  if (!pos) return undefined;
  const { lat, lng } = pos;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}
