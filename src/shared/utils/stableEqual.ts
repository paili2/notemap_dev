// src/shared/utils/stableEqual.ts
function isPlainObject(x: any) {
  return x && typeof x === "object" && !Array.isArray(x);
}
function pruneUndefined(x: any): any {
  if (Array.isArray(x)) return x.map(pruneUndefined);
  if (isPlainObject(x)) {
    const out: any = {};
    for (const k of Object.keys(x)) {
      const v = x[k];
      if (v !== undefined) out[k] = pruneUndefined(v);
    }
    return out;
  }
  return x;
}
function stableStringify(obj: any): string {
  const seen = new WeakSet();
  const order = (o: any): any => {
    if (o === null || typeof o !== "object") return o;
    if (seen.has(o)) return null;
    seen.add(o);
    if (Array.isArray(o)) return o.map(order);
    const keys = Object.keys(o).sort();
    const out: any = {};
    for (const k of keys) out[k] = order(o[k]);
    return out;
  };
  return JSON.stringify(order(pruneUndefined(obj)));
}
export function stableEqual(a: any, b: any) {
  return stableStringify(a) === stableStringify(b);
}
