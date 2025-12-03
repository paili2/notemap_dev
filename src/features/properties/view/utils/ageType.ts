export type AgeType = "NEW" | "OLD" | null;

/* === 연식 관련 유틸 === */
export function normalizeBoolLoose(v: unknown): boolean | undefined {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  if (typeof v === "number") return v !== 0 ? true : false;
  return undefined;
}

/** ✅ 우선순위: ageType → isNew/isOld → buildingAgeType → buildingGrade(레거시) */
export function deriveAgeTypeFrom(src: any): AgeType {
  // 1) 신규 필드: ageType 우선
  const t0 = (src?.ageType ?? "").toString().toUpperCase();
  if (t0 === "NEW" || t0 === "OLD") return t0 as AgeType;

  // 2) 레거시 bool 플래그
  const nIsNew = normalizeBoolLoose(src?.isNew);
  const nIsOld = normalizeBoolLoose(src?.isOld);
  if (nIsNew === true && nIsOld !== true) return "NEW";
  if (nIsOld === true && nIsNew !== true) return "OLD";

  // 3) 레거시 buildingAgeType 문자열
  const t = (src?.buildingAgeType ?? "").toString().toUpperCase();
  if (t === "NEW" || t === "OLD") return t as AgeType;

  // 4) 레거시 buildingGrade(new/old) 문자열
  const g = (src?.buildingGrade ?? "").toString().toLowerCase();
  if (g === "new") return "NEW";
  if (g === "old") return "OLD";

  return null;
}
