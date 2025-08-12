export function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    // @ts-ignore older TS dom types
    return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 9);
}
