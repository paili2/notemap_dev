import { hexToRgba, isWhiteLike } from "@/lib/color";

export function styleLabelEl(
  el: HTMLDivElement,
  accentHex: string,
  gapPx = 12
) {
  const textColor = isWhiteLike(accentHex) ? "#111827" : "#ffffff";
  const shadow = isWhiteLike(accentHex)
    ? "rgba(0,0,0,0.08)"
    : hexToRgba(accentHex, 0.25);
  Object.assign(el.style, {
    transform: `translateY(calc(-150% - ${gapPx}px))`,
    padding: "6px 10px",
    borderRadius: "8px",
    background: accentHex,
    color: textColor,
    fontWeight: "700",
    border: "1px solid rgba(0,0,0,0.12)",
    boxShadow: `0 4px 12px ${shadow}`,
    fontSize: "12px",
    lineHeight: "1",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    userSelect: "none",
    display: "inline-block",
    visibility: "visible",
  } as CSSStyleDeclaration);
}

export function styleHitboxEl(el: HTMLDivElement, sizePx = 48) {
  const size = `${sizePx}px`;
  Object.assign(el.style, {
    width: size,
    height: size,
    borderRadius: "9999px",
    background: "rgba(0,0,0,0)",
    pointerEvents: "auto",
    cursor: "pointer",
    touchAction: "manipulation",
  } as CSSStyleDeclaration);
}
