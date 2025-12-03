import type { AnyImageRef } from "@/features/properties/types/media";

/* 입력 정규화 헬퍼 */
export function looksLikeImageRef(v: any): boolean {
  if (!v || typeof v !== "object") return false;
  return (
    typeof (v as any).url === "string" ||
    typeof (v as any).idbKey === "string" ||
    typeof (v as any).id === "number" ||
    typeof (v as any).id === "string"
  );
}

export function normalizeCardsInput(v: any): AnyImageRef[][] | null {
  if (!v) return null;

  if (Array.isArray(v) && v.every((x) => Array.isArray(x)))
    return v as AnyImageRef[][];

  if (Array.isArray(v) && v.some(looksLikeImageRef))
    return [v as AnyImageRef[]];

  if (typeof v === "object") {
    const entries = Object.entries(v)
      .filter(([k]) => /^\d+$/.test(k))
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, val]) => val)
      .filter((arr) => Array.isArray(arr));

    if (entries.length > 0) return entries as AnyImageRef[][];
    if (looksLikeImageRef(v)) return [[v as AnyImageRef]];
  }

  return null;
}

export function normalizeVerticalInput(v: any): AnyImageRef[] | null {
  if (!v) return null;
  if (Array.isArray(v) && v.length && v.every(looksLikeImageRef))
    return v as AnyImageRef[];

  if (typeof v === "object") {
    const numKeyVals = Object.entries(v)
      .filter(([k]) => /^\d+$/.test(k))
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, val]) => val);

    if (numKeyVals.length && numKeyVals.every(looksLikeImageRef)) {
      return numKeyVals as AnyImageRef[];
    }
    if (looksLikeImageRef(v)) return [v as AnyImageRef];
  }

  return null;
}
