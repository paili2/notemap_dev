"use client";

import { useEffect, useState } from "react";

export function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);

    const listener = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile("matches" in e ? e.matches : mq.matches);
    };

    // 초기값 세팅
    listener(mq);

    // 변화 감지
    mq.addEventListener("change", listener as any);
    return () => mq.removeEventListener("change", listener as any);
  }, [maxWidth]);

  return isMobile;
}
