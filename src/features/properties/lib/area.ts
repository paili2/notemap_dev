/** 1평 = 3.305785㎡ */
export const PYEONG = 3.305785 as const;

/** 내부 유틸: 숫자/문자 입력을 안전하게 숫자로 정규화 */
function sanitizeNum(input: unknown): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }
  if (typeof input === "string") {
    // 공백/콤마 제거 → 끝의 단위 토큰 제거(대소문자 무시)
    const cleaned = input
      .trim()
      .replace(/[, ]+/g, "") // "1,234.5 m²" -> "1234.5m²"
      .replace(/(?:㎡|m2|m²|평|py)+$/i, ""); // "1234.5m²" -> "1234.5"
    const n = parseFloat(cleaned.replace(/^\+/, "")); // +부호 허용
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** 소수 자릿수 정규화 (기본 2, 음수/NaN 방지) */
function normDecimals(d?: number): number {
  const n = Number.isFinite(d as number) ? Math.floor(d as number) : 2;
  return n >= 0 ? n : 2;
}

/** ㎡ → 평 (소수 n자리, 기본 2자리) */
export const toPy = (m2?: string | number, decimals = 2): string => {
  const n = sanitizeNum(m2);
  if (n == null) return "";
  return (n / PYEONG).toFixed(normDecimals(decimals));
};

/** 평 → ㎡ (소수 n자리, 기본 2자리) */
export const toM2 = (py?: string | number, decimals = 2): string => {
  const n = sanitizeNum(py);
  if (n == null) return "";
  return (n * PYEONG).toFixed(normDecimals(decimals));
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

/** "m2Min~m2Max|pyMin~pyMax" 또는 "m2Min~m2Max" 또는 "pyMin~pyMax" 지원
 *  - m² 파트가 있으면 그대로 사용
 *  - 평 파트만 있으면 평→m² 변환해서 반환
 */
export const parsePackedRangeToM2 = (
  packed?: string | null
): { minM2: string; maxM2: string } => {
  const s = String(packed ?? "").trim();
  if (!s) return { minM2: "", maxM2: "" };

  const [m2Part = "", pyPart = ""] = s
    .split("|", 2)
    .map((x) => (x ?? "").trim());

  if (m2Part) {
    const { min, max } = unpackRange(m2Part);
    return { minM2: min, maxM2: max };
  }
  if (pyPart) {
    const { min, max } = unpackRange(pyPart);
    return {
      minM2: min ? toM2(min) : "",
      maxM2: max ? toM2(max) : "",
    };
  }
  return { minM2: "", maxM2: "" };
};

/** "R/B" 문자열을 { rooms, baths } 로 파싱 (여백/이상치 허용) */
export const parsePreset = (s: string) => {
  const [r, b] = String(s)
    .replace(/\s/g, "")
    .split("/", 2)
    .map((n) => parseInt(n, 10));
  return {
    rooms: Number.isFinite(r) ? r : 0,
    baths: Number.isFinite(b) ? b : 0,
  };
};
