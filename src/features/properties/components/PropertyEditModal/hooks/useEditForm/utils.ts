import type { OrientationValue } from "./types";

export const asStr = (v: unknown) => (v == null ? "" : String(v));

export const asYMD = (v: unknown) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = asStr(v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
};

export const asNum = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const unpackRange = (s: unknown): { min: string; max: string } => {
  const raw = asStr(s).trim();
  if (!raw) return { min: "", max: "" };
  const [min, max] = raw.split("~", 2);
  return { min: (min ?? "").trim(), max: (max ?? "").trim() };
};

export const pickOrientation = (o: unknown): OrientationValue | "" =>
  ((o as any)?.dir ?? (o as any)?.direction ?? (o as any)?.value ?? "") as
    | OrientationValue
    | "";
