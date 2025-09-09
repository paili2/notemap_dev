export const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Date -> "YYYY-MM-DD"
 *  options.utc: true면 getUTC* 사용 (기본 false: 로컬)
 */
export function toYMD(d: Date, options?: { utc?: boolean }): string {
  const utc = options?.utc ?? false;
  const y = utc ? d.getUTCFullYear() : d.getFullYear();
  const m = String((utc ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, "0");
  const day = String(utc ? d.getUTCDate() : d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "YYYY-MM-DD" -> Date (로컬 타임존으로 생성)
 *  형식/달력 날짜가 유효하지 않으면 null
 */
export function parseYMD(ymd: string): Date | null {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  // 달력 유효성 체크(2월 30일 등 배제)
  const dt = new Date(y, mo - 1, d);
  const ok =
    dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
  return ok ? dt : null;
}

/** Date|string|null|undefined -> "YYYY-MM-DD"|null */
export function toYMDFlexible(
  v: string | Date | null | undefined,
  options?: { utc?: boolean }
): string | null {
  if (v instanceof Date) return toYMD(v, options);
  return v ?? null;
}

/** "YYYY-MM-DD" 전체 형식 & 달력 유효성 */
export function isValidYMD(ymd: string): boolean {
  return parseYMD(ymd) !== null;
}

export function isValidYmd(s: string) {
  if (!YMD_REGEX.test(s)) return false;
  const t = Date.parse(s);
  return !Number.isNaN(t);
}
