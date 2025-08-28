// 한국 전화번호 자동 하이픈 포맷터
// 지원: 010/011/016/017/018/019, 지역번호(02/031 등), 대표번호(15xx/16xx/18xx), 070/080/050x 등
export function formatPhone(raw: string): string {
  const d = (raw || "").replace(/\D/g, "");

  // 대표번호 15xx/16xx/18xx
  if (/^1\d{3,7}$/.test(d)) {
    if (d.length <= 4) return d;
    return d.slice(0, 4) + "-" + d.slice(4, 8);
  }

  // 서울 02 (2자리 지역번호)
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`; // 02-XXX
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`; // 02-XXX-XXXX
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`; // 02-XXXX-XXXX
  }

  // 휴대폰 01X (010/011/016/017/018/019)
  if (/^01[0-9]/.test(d)) {
    if (d.length <= 3) return d; // 010
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`; // 010-1234
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`; // 010-1234-5678
  }

  // 050x, 070, 080 등 (3자리 국번)
  if (/^0[5-8]0/.test(d) || /^070/.test(d) || /^080/.test(d)) {
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }

  // 일반 지역번호 (031, 032, 051 등 3자리 지역번호)
  if (/^0\d{2}/.test(d)) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`; // 031-123
    if (d.length <= 10)
      return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`; // 031-123-4567
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`; // 031-1234-5678
  }

  // 그 외: 숫자만 그대로 (혹시 특수 케이스 대비)
  return d;
}
