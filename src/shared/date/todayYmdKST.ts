/** KST(한국표준시) 기준 "YYYY-MM-DD" 문자열 반환 */
export function todayYmdKST(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    date
  );
}
