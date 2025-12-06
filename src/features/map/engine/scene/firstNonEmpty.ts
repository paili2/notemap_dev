// 첫 번째 “실제 값” 선택
export function firstNonEmpty(...vals: Array<unknown>) {
  for (const v of vals) {
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length > 0) return t;
    } else if (typeof v === "number") {
      return String(v);
    }
  }
  return undefined;
}
