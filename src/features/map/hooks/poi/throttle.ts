"use client";

import { useCallback, useRef } from "react";

/** 간단한 leading+trailing throttle */
export function useThrottle<T extends (...a: any[]) => void>(
  fn: T,
  wait: number
) {
  const lastRef = useRef(0);
  const timer = useRef<any>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = wait - (now - lastRef.current);
      if (remaining <= 0) {
        lastRef.current = now;
        fn(...args);
      } else {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          lastRef.current = Date.now();
          fn(...args);
        }, remaining);
      }
    },
    [fn, wait]
  );
}
