"use client";

import { useEffect, useCallback } from "react";

type UseEscapeToCloseOptions = {
  /** Esc 동작 활성화 여부 (기본값 true) */
  enabled?: boolean;
  /** 감지할 키 (기본값 'Escape') */
  key?: string;
  /** keydown 시 기본 동작 차단 여부 (기본값 false) */
  preventDefault?: boolean;
};

/**
 * 지정된 key(기본 Esc) 입력 시 onClose 실행
 */
export function useEscapeToClose(
  onClose: () => void,
  {
    enabled = true,
    key = "Escape",
    preventDefault = false,
  }: UseEscapeToCloseOptions = {}
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === key) {
        if (preventDefault) e.preventDefault();
        onClose();
      }
    },
    [onClose, key, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}
