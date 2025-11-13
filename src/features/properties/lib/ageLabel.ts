// lib/ageLabel.ts

// 고정 우선순위: 신축 > 구옥 > (완공일 추정) > 기본값(신축)
// UI 스펙상 "-"는 존재하지 않으므로 반환 타입은 "신축" | "구옥" 로 한정
export const DEFAULT_NEW_YEARS_THRESHOLD = 5;

/** 유효한 Date 객체인지 검사 */
function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

/** 연식 라벨 계산 (이분 전용) */
export function getAgeLabel(args: {
  isNew?: boolean;
  isOld?: boolean;
  completionDate?: string | Date | null;
  newYearsThreshold?: number; // 기본 5년
}): "신축" | "구옥" {
  const {
    isNew,
    isOld,
    completionDate,
    newYearsThreshold = DEFAULT_NEW_YEARS_THRESHOLD,
  } = args ?? {};

  // 1) 서버 명시값 최우선: 신축 > 구옥
  if (isNew === true) return "신축";
  if (isOld === true) return "구옥";

  // 2) 명시값 없으면 완공일로 추정
  if (completionDate) {
    const dt =
      completionDate instanceof Date
        ? completionDate
        : new Date(completionDate);
    if (isValidDate(dt)) {
      const years =
        (Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return years <= newYearsThreshold ? "신축" : "구옥";
    }
  }

  // 3) 판단 값이 전혀 없을 때: UI 라디오 기본값에 맞춰 "신축"으로 귀결
  return "신축";
}
