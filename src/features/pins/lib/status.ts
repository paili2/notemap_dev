import type { PinItem } from "@/features/pins/types";

type PinStatus = "draft" | "plan" | "listed";

/** PinItem + (선택) propertyId 로 draft/plan/listed를 일관되게 계산 */
function computeStatus(
  pin?: PinItem | null,
  propertyId?: string | null
): PinStatus {
  if (!pin) {
    // 핀이 없고 property만 있으면 등록 완료로 보고, 아니면 draft
    return propertyId ? "listed" : "draft";
  }

  // 1) 진짜 임시핀: state === "draft" 우선
  if (pin.state === "draft") return "draft";

  // 2) 답사/방문 예정핀: kind === "question"
  if (pin.kind === "question") return "plan";

  // 3) 나머지: propertyId가 있으면 listed, 없으면 draft 취급
  if (propertyId) return "listed";

  return "draft";
}

export function isDraftPin(pin?: PinItem | null, propertyId?: string | null) {
  return computeStatus(pin, propertyId) === "draft";
}
export function isPlanPin(pin?: PinItem | null, propertyId?: string | null) {
  return computeStatus(pin, propertyId) === "plan";
}
export function isListedPin(pin?: PinItem | null, propertyId?: string | null) {
  return computeStatus(pin, propertyId) === "listed";
}
