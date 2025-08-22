export const parsePreset = (s: string) => {
  const [r, b] = s.split("/").map((n) => parseInt(n, 10));
  return { rooms: r || 0, baths: b || 0 };
};
