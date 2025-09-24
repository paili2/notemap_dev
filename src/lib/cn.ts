import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// className을 깔끔하게 합치고,중복되거나 충돌하는 Tailwind 클래스 자동 정리
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// teMerge(...) Tailwind CSS 클래스 중에서 서로 충돌하는 것들을 정리해주는 함수
// clsx(...) 문자열, 불리언 조건, 배열 등을 깔끔하게 className으로 조합해주는 함수! 예: false면 무시하고, 중복되면 하나로 만들어줌
