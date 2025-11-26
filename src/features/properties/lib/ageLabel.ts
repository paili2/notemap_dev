export const DEFAULT_NEW_YEARS_THRESHOLD = 5;

/** 유효한 Date 객체인지 검사 */
function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

/**
 * 연식 라벨 계산
 * 우선순위:
 * 1) isOld = true  → 구옥
 * 2) isNew = true  → 신축
 * 3) (자동 판정 없이) 정보 없으면 "-"
 *
 * ✅ 신축/구옥을 직접 선택하지 않았다면,
 *    completionDate가 있어도 절대 "신축"/"구옥"으로 자동 표시하지 않는다.
 */
export function getAgeLabel(args: {
  isNew?: boolean | null;
  isOld?: boolean | null;
  completionDate?: string | Date | null;
  newYearsThreshold?: number;
}): "신축" | "구옥" | "-" {
  const {
    isNew,
    isOld,
    completionDate,
    newYearsThreshold = DEFAULT_NEW_YEARS_THRESHOLD,
  } = args ?? {};

  // 1) 명시 플래그 최우선 — 구옥 > 신축
  if (isOld === true) return "구옥";
  if (isNew === true) return "신축";

  // 2) 명시 플래그가 둘 다 없거나(false/undefined/null)면 → 항상 "-"
  const noFlag =
    (isNew === null || isNew === undefined || isNew === false) &&
    (isOld === null || isOld === undefined || isOld === false);

  if (noFlag) {
    return "-";
  }

  // (필요하면 여기에 completionDate 기반 자동 판정을 넣을 수 있지만,
  //  지금 요구사항대로라면 자동 판정은 완전히 막는다.)

  return "-";
}
