"use client";

import { useEffect } from "react";

/**
 * Esc 키로 닫기 핸들러
 * @param onClose 닫기 실행 함수
 * @param isActive true일 때만 동작 (기본값 true)
 */
export function useEscapeToClose(
  onClose: () => void,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, isActive]);
}
