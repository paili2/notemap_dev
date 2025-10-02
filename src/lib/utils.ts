import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// className을 깔끔하게 합치고, 중복되거나 충돌하는 Tailwind 클래스 자동 정리
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
