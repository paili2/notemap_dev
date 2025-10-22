import type { PinItem } from "@/features/pins/types"; // 현재 올려준 PinItem 경로에 맞게 수정

type PinStatus = "draft" | "plan" | "listed";

/** PinItem + (선택) propertyId 로 draft/plan/listed를 일관되게 계산 */
function computeStatus(
  pin?: PinItem | null,
  propertyId?: string | null
): PinStatus {
  // 1) draft 우선: state가 draft 이거나, 아직 propertyId가 없음
  if (!propertyId || pin?.state === "draft") return "draft";

  // 2) plan: 방문/답사 예정은 kind === "question" 으로 정의
  if (pin?.kind === "question") return "plan";

  // 3) listed: 그 외 저장된 매물
  return "listed";
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
