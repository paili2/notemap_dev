export function toGroupingPosKey(lat?: number, lng?: number) {
  if (typeof lat === "number" && typeof lng === "number") {
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
  }
  return undefined;
}
