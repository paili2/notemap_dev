import type { Grade } from "@/features/properties/types/property-domain";

export const starsToGrade = (n: number): "상" | "중" | "하" | undefined => {
  if (n >= 4) return "상";
  if (n >= 2) return "중";
  if (n > 0) return "하";
  return undefined;
};

export const gradeToStars = (g?: Grade): number =>
  g === "상" ? 4 : g === "중" ? 3 : g === "하" ? 1 : 0;
