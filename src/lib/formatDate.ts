export function formatDate(raw: string): string {
  const digits = raw.replace(/\D/g, ""); // 숫자만 추출

  if (digits.length <= 4) return digits; // YYYY
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`; // YYYY-MM
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`; // YYYY-MM-DD
}
