const PYEONG_TO_M2 = 3.305785;

export const toM2 = (s: string) => {
  const n = Number((s ?? "").replaceAll(",", "").trim());
  return Number.isFinite(n) && n >= 0
    ? Math.round(n * PYEONG_TO_M2)
    : undefined;
};

// 0 이하는 "입력 안 함"으로 간주
export const parsePositiveNumber = (s: string) => {
  const n = Number((s ?? "").replaceAll(",", "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
};

// 범위 검증 (라벨 + 최소/최대 문자열)
export function validateRangeLabel(
  label: string,
  minStr: string,
  maxStr: string
): string | null {
  const min = parsePositiveNumber(minStr);
  const max = parsePositiveNumber(maxStr);

  // 둘 중 하나라도 안 적혀 있으면 (부분검색 허용) → 통과
  if (min === null || max === null) return null;

  if (min === max) {
    return `${label}의 최소값과 최대값이 같을 수 없어요.`;
  }
  if (max < min) {
    return `${label}의 최대값은 최소값보다 커야 해요.`;
  }
  return null;
}
