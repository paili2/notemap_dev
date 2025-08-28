/** 1평 = 3.305785㎡ */
export const PYEONG = 3.305785;

/** 내부 유틸: 숫자/문자 입력을 안전하게 숫자로 정규화 */
function sanitizeNum(input: unknown): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }
  if (typeof input === "string") {
    // 공백, 단위, 천단위 구분자 제거 (㎡, 평, m2, py 등)
    const cleaned = input
      .trim()
      .replace(/[, ]+/g, "")
      .replace(/(㎡|m2|m²|평|py)$/i, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** ㎡ → 평 (소수 n자리, 기본 2자리) */
export const toPy = (m2?: string | number, decimals = 2): string => {
  const n = sanitizeNum(m2);
  if (n == null) return "";
  return (n / PYEONG).toFixed(decimals);
};

/** 평 → ㎡ (소수 n자리, 기본 2자리) */
export const toM2 = (py?: string | number, decimals = 2): string => {
  const n = sanitizeNum(py);
  if (n == null) return "";
  return (n * PYEONG).toFixed(decimals);
};

/** "a~b" 포맷으로 합치기 (a/b 빈칸 허용) */
export const packRange = (a: string, b: string): string => {
  const A = (a ?? "").trim();
  const B = (b ?? "").trim();
  if (A && B) return `${A}~${B}`;
  if (A) return `${A}~`;
  if (B) return `~${B}`;
  return "";
};

/** "a~b" → { min, max } 로 풀기 (없으면 빈문자열) */
export const unpackRange = (
  range?: string | null
): { min: string; max: string } => {
  const raw = String(range ?? "").trim();
  if (!raw) return { min: "", max: "" };
  const [min, max] = raw.split("~", 2);
  return { min: (min ?? "").trim(), max: (max ?? "").trim() };
};

/** "R/B" 문자열을 { rooms, baths } 로 파싱 (여백/이상치 허용) */
export const parsePreset = (s: string) => {
  const [r, b] = String(s)
    .replace(/\s/g, "")
    .split("/")
    .map((n) => parseInt(n, 10));
  return {
    rooms: Number.isFinite(r) ? r : 0,
    baths: Number.isFinite(b) ? b : 0,
  };
};
