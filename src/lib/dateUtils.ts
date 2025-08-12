export const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isValidYmd(s: string) {
  if (!YMD_REGEX.test(s)) return false;
  const t = Date.parse(s);
  return !Number.isNaN(t);
}
