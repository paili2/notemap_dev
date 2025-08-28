export function parsePreset(s: string): { rooms: number; baths: number } {
  // "2/1", "2 / 1", "2-1", "2:1", "2x1" 다 허용
  const [r, b] = s.split(/[\/:x-]/i).map((n) => Number.parseInt(n.trim(), 10));
  return {
    rooms: Number.isFinite(r) ? r : 0,
    baths: Number.isFinite(b) ? b : 0,
  };
}

// (선택) 문자열로 다시 만들 때 쓰기 좋음
export function formatPreset(rooms: number, baths: number) {
  return `${rooms || 0}/${baths || 0}`;
}
