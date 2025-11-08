export function pruneNullishDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj
      .map((v) => pruneNullishDeep(v))
      .filter((v) => v !== undefined && v !== null) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      const child = pruneNullishDeep(v as any);
      if (Array.isArray(child) && child.length === 0) continue;
      out[k] = child;
    }
    return out as T;
  }
  return obj;
}

export const sanitizeDirections = (arr?: string[]) =>
  Array.isArray(arr) && arr.length
    ? Array.from(new Set(arr.map((s) => (s ?? "").trim()).filter(Boolean))).map(
        (direction) => ({ direction })
      )
    : undefined;

export const sanitizeAreaGroups = (groups?: any[]) => {
  if (!Array.isArray(groups)) return undefined;
  const cleaned = groups
    .map((g, i) => {
      const o: any = {};
      const title = (g?.title ?? "").trim();
      if (title) o.title = title;

      const numKeys = [
        "exclusiveMinM2",
        "exclusiveMaxM2",
        "actualMinM2",
        "actualMaxM2",
      ] as const;
      for (const key of numKeys) {
        const val = g?.[key];
        if (typeof val === "number" && Number.isFinite(val) && val >= 0) {
          o[key] = val;
        }
      }
      const so = g?.sortOrder ?? i + 1;
      if (Number.isInteger(so) && so >= 0) o.sortOrder = so;

      return o;
    })
    .filter((g) => Object.keys(g).length > 0);

  return cleaned.length ? cleaned : undefined;
};

// 다양한 서버 에러 포맷을 통합 추출
export const pickErrorMessage = (e: any) => {
  const msgs =
    e?.response?.data?.messages ??
    e?.responseData?.messages ??
    e?.messages ??
    e?.message;
  return Array.isArray(msgs) ? msgs.join("\n") : String(msgs ?? "");
};
