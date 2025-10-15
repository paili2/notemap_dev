import { LABEL, HITBOX } from "@/features/map/lib/constants";

// 공통 색/상수
export const ACCENT = "#3B82F6";
export const DRAFT_ID = "__draft__";
export const SELECTED_Z = 2000;

/** 말풍선 라벨 스타일 적용 */
export const applyLabelStyles = (
  el: HTMLDivElement,
  gapPx: number = LABEL.GAP_PX // ← number로 명시
) => {
  Object.assign(el.style, {
    transform: `translateY(calc(-150% - ${gapPx}px))`,
    padding: "6px 10px",
    borderRadius: "8px",
    background: ACCENT,
    color: "#ffffff",
    fontWeight: "700",
    border: "1px solid rgba(0,0,0,0.12)",
    boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
    fontSize: "12px",
    lineHeight: "1",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    userSelect: "none",
  } as CSSStyleDeclaration);
};

/** 히트박스 스타일 적용 */
export const applyHitboxStyles = (
  el: HTMLDivElement,
  sizePx: number = HITBOX.DIAMETER_PX // ← number로 명시
) => {
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
};

/** 순번 배지 + 텍스트 라벨 구성 (XSS 방지 위해 textContent 사용) */
export const applyOrderBadgeToLabel = (
  el: HTMLDivElement,
  text: string,
  order?: number | null
) => {
  el.textContent = "";

  if (order) {
    const badge = document.createElement("span");
    Object.assign(badge.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      minWidth: "18px",
      borderRadius: "9999px",
      fontSize: "10px",
      fontWeight: "800",
      background: "#fff",
      color: "#000",
      marginRight: "6px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
    } as CSSStyleDeclaration);
    badge.textContent = String(order);
    el.appendChild(badge);
  }

  const textSpan = document.createElement("span");
  textSpan.textContent = text ?? "";
  el.appendChild(textSpan);
};
