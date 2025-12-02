"use client";

export function assertNoTruncate(tag: string, lat: number, lng: number) {
  const latStr = String(lat);
  const lngStr = String(lng);
  const latDec = latStr.split(".")[1]?.length ?? 0;
  const lngDec = lngStr.split(".")[1]?.length ?? 0;
  // eslint-disable-next-line no-console
  console.debug(`[coords-send:${tag}]`, {
    lat,
    lng,
    latStr,
    lngStr,
    latDecimals: latDec,
    lngDecimals: lngDec,
  });
  if (process.env.NODE_ENV !== "production") {
    if (latDec < 6 || lngDec < 6) {
      // eslint-disable-next-line no-console
      console.warn(`[coords-low-precision:${tag}] 소수 자릿수 부족`, {
        latStr,
        lngStr,
      });
    }
  }
}

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
