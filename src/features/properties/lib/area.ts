export const PYEONG = 3.3058;

export const toPy = (m2: string) => {
  const n = parseFloat(m2);
  return Number.isFinite(n) ? (n / PYEONG).toFixed(2) : "";
};

export const toM2 = (py: string) => {
  const n = parseFloat(py);
  return Number.isFinite(n) ? (n * PYEONG).toFixed(2) : "";
};

// "a~b" 포맷
export const packRange = (a: string, b: string) => {
  const A = a.trim(),
    B = b.trim();
  if (A && B) return `${A}~${B}`;
  if (A) return `${A}~`;
  if (B) return `~${B}`;
  return "";
};

export const parsePreset = (s: string) => {
  const [r, b] = s.split("/").map((n) => parseInt(n, 10));
  return { rooms: r || 0, baths: b || 0 };
};
