// 뷰 전용 유틸

import { toPy } from "@/features/properties/lib/area";

export const asStr = (v: unknown) => (v == null ? "" : String(v));

export const asNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// "a~b" → {min, max}
export const unpackRange = (s?: string | null) => {
  const raw = asStr(s).trim();
  if (!raw) return { min: "", max: "" };
  const [min, max] = raw.split("~", 2);
  return { min: (min ?? "").trim(), max: (max ?? "").trim() };
};

// Date|string → YYYY.MM.DD (대충 보기용)
export const fmtYMD = (v: unknown) => {
  if (!v) return "";
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = `${v.getMonth() + 1}`.padStart(2, "0");
    const d = `${v.getDate()}`.padStart(2, "0");
    return `${y}.${m}.${d}`;
  }
  const s = asStr(v);
  // 2024-03-01 또는 2024.03.01 형태 대응
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10).replace(/-/g, ".");
  if (/^\d{4}\.\d{2}\.\d{2}/.test(s)) return s.slice(0, 10);
  return s;
};

// 10000 → "10,000"
export const comma = (v: unknown) => {
  const n = asNum(v);
  if (n === undefined) return asStr(v);
  return n.toLocaleString();
};

// OrientationRow 호환 추출
export const pickOrientation = (o: unknown): string =>
  (o as any)?.dir ?? (o as any)?.direction ?? (o as any)?.value ?? "";

export const formatRangeWithPy = (range?: string | null) => {
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
