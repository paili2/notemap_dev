"use client";

import { LatLng } from "@/lib/geo/types";
import { useCallback, useEffect, useRef } from "react";

export function useViewportQuery() {
  const inFlightRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string | null>(null);

  const round = (n: number, p = 5) => {
    const f = Math.pow(10, p);
    return Math.round(n * f) / f;
  };

  const sendViewportQuery = useCallback(
    async (
      q: {
        leftTop: LatLng;
        leftBottom: LatLng;
        rightTop: LatLng;
        rightBottom: LatLng;
        zoomLevel: number;
      },
      opts?: { force?: boolean }
    ) => {
      // 라운딩 버전으로 key와 payload를 동기화
      const rq = {
        leftTop: { lat: round(q.leftTop.lat), lng: round(q.leftTop.lng) },
        leftBottom: {
          lat: round(q.leftBottom.lat),
          lng: round(q.leftBottom.lng),
        },
        rightTop: { lat: round(q.rightTop.lat), lng: round(q.rightTop.lng) },
        rightBottom: {
          lat: round(q.rightBottom.lat),
          lng: round(q.rightBottom.lng),
        },
        zoomLevel: q.zoomLevel,
      };
      const key = JSON.stringify({ ...rq });

      if (!opts?.force && lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      // 이전 요청 중단
      if (inFlightRef.current) {
        inFlightRef.current.abort();
        inFlightRef.current = null;
      }
      const ac = new AbortController();
      inFlightRef.current = ac;

      try {
        // ① 프록시(rewrite) 방식: /api/pins → 3050
        // next.config.js에 rewrites 설정되어 있어야 함
        const res = await fetch("/api/pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rq),
          signal: ac.signal,
        });

        // ② 직접 백엔드 호출 방식이라면 위 fetch 대신 아래 사용:
        // const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3050";
        // const res = await fetch(`${BASE}/pins`, { ...같은 옵션... });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${text}`);
        }

        // 필요하면 결과 사용:
        // const data = await res.json();
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[viewport] fetch failed:", err);
          // 필요하면 다시 보낼 수 있도록 키 리셋
          // lastKeyRef.current = null;
          throw err; // 호출부에서 토스트/리트라이 처리 가능
        }
      } finally {
        if (inFlightRef.current === ac) inFlightRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
    };
  }, []);

  return { sendViewportQuery };
}
