import { toYMDFlexible, YMD_REGEX } from "@/lib/dateUtils";
import { toPy } from "@/features/properties/lib/area";

/** unknown -> string (null/undefined → "") */
const asStr = (v: unknown): string => (v == null ? "" : String(v));

/** unknown -> number | undefined (문자열의 콤마 제거까지 느슨히 허용) */
const asNum = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const s = asStr(v).replace(/,/g, "").trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** Date | string | null | undefined → "YYYY.MM.DD" (보기용)
 *  - Date는 toYMDFlexible 통해 "YYYY-MM-DD" 만들고 점(.)으로 치환
 *  - 문자열은 "YYYY-MM-DD" 또는 "YYYY.MM.DD"만 10자리로 정규화
 *  - 그 외는 원본 문자열 반환
 */
export const fmtYMD = (v: unknown, opts?: { utc?: boolean }): string => {
  if (!v) return "";
  if (v instanceof Date) {
    const ymd = toYMDFlexible(v, opts); // "YYYY-MM-DD"
    return ymd ? ymd.replace(/-/g, ".") : "";
  }
  const s = asStr(v);
  if (YMD_REGEX.test(s)) return s.slice(0, 10).replace(/-/g, ".");
  if (/^\d{4}\.\d{2}\.\d{2}/.test(s)) return s.slice(0, 10);
  return s;
};

/** 숫자 → "10,000" (문자/NaN은 원본 문자열 반환) */
export const comma = (v: unknown, locale: string = "ko-KR"): string => {
  const n = asNum(v);
  if (n === undefined) return asStr(v);
  return n.toLocaleString(locale);
};

/** "a~b" (m²) → "a ~ b m² (x ~ y 평)" */
export const formatRangeWithPy = (range?: string | null): string => {
  const raw = (range ?? "").trim();
  if (!raw) return "-";

  const [a, b] = raw.split("~", 2);
  const aM2 = (a ?? "").trim();
  const bM2 = (b ?? "").trim();

  const aPy = aM2 ? toPy(aM2) : "";
  const bPy = bM2 ? toPy(bM2) : "";

  const m2Part = `${aM2 || "-"} ~ ${bM2 || "-"} m²`;
  const pyPart = `${aPy || "-"} ~ ${bPy || "-"} 평`;
  return `${m2Part} (${pyPart})`;
};
