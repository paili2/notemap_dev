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
 * 3) 완료일 기반 판단
 * 4) 정보 없으면 "-"
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

  // 2) 명시 플래그 없으면 준공일 기반 추정
  if (completionDate) {
    const dt =
      completionDate instanceof Date
        ? completionDate
        : new Date(completionDate);

    if (isValidDate(dt)) {
      const diffYears =
        (Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return diffYears <= newYearsThreshold ? "신축" : "구옥";
    }
  }

  // 3) 완전히 정보 없으면 중립
  return "-";
}
