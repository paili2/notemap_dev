/** "__something" 같은 내부 키는 라벨 후보에서 제거 */
export function cleanLabelCandidate(v: unknown) {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t) return undefined;
  if (t.startsWith("__")) return undefined;
  return t;
}
