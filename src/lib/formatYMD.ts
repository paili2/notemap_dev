export function toYMD(d: Date) {
  // 로컬 타임존 영향을 피하고 싶다면 getUTC* 로 바꿔도 OK
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
