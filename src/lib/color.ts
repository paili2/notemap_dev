/** #RRGGBB / #RGB → rgba */
export function hexToRgba(hex: string, alpha = 1) {
  const m = hex.replace("#", "");
  const v =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = parseInt(v, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 화이트 계열인지 간단 판정 */
export function isWhiteLike(color?: string) {
  const c = color?.trim().toLowerCase();
  return c === "#fff" || c === "#ffffff" || c === "white";
}
