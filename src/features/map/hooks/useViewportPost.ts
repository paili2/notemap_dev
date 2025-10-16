// src/features/map/hooks/useViewportPost.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import { LatLng } from "@/lib/geo/types";
import { getPinsMapOnce } from "@/shared/api/api"; // 전용 래퍼만 사용

export function useViewportPost() {
  const inFlightRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ranOnceRef = useRef(false); // (dev StrictMode) 최초 2회 방지 용도

  const round = (n: number, p = 6) => {
    const f = 10 ** p;
    return Math.round(n * f) / f;
  };

  const _send = useCallback(
    async (q: {
      leftTop: LatLng;
      leftBottom: LatLng;
      rightTop: LatLng;
      rightBottom: LatLng;
      zoomLevel: number;
    }) => {
      const lats = [
        q.leftTop.lat,
        q.leftBottom.lat,
        q.rightTop.lat,
        q.rightBottom.lat,
      ];
      const lngs = [
        q.leftTop.lng,
        q.leftBottom.lng,
        q.rightTop.lng,
        q.rightBottom.lng,
      ];

      let swLat = round(Math.min(...lats));
      let swLng = round(Math.min(...lngs));
      let neLat = round(Math.max(...lats));
      let neLng = round(Math.max(...lngs));

      // 면적 0 방지
      const EPS = 1e-6;
      if (neLat - swLat < EPS) {
        swLat = round(swLat - EPS);
        neLat = round(neLat + EPS);
      }
      if (neLng - swLng < EPS) {
        swLng = round(swLng - EPS);
        neLng = round(neLng + EPS);
      }

      // 동일 파라미터 재호출 차단(이 훅 인스턴스 기준)
      const key = `${swLat},${swLng},${neLat},${neLng},z${q.zoomLevel}`;
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      // 진행 중 요청 취소(뷰 이동 중첩 대비)
      inFlightRef.current?.abort();
      const ac = new AbortController();
      inFlightRef.current = ac;

      try {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[/pins/map] params →", {
            swLat,
            swLng,
            neLat,
            neLng,
            draftState: "all",
            zoom: q.zoomLevel,
          });
        }

        // 전용 래퍼: 내부에서 URL/params 정규화 + single-flight + 세마포어
        await getPinsMapOnce(
          { swLat, swLng, neLat, neLng, draftState: "all" },
          ac.signal
        );
      } catch (err: any) {
        const canceled =
          err?.code === "ERR_CANCELED" ||
          err?.name === "AbortError" ||
          err?.name === "CanceledError";
        if (!canceled) {
          // eslint-disable-next-line no-console
          console.error(
            "[/pins/map] viewport fetch failed:",
            err?.response?.data || err
          );
        }
      } finally {
        if (inFlightRef.current === ac) inFlightRef.current = null;
      }
    },
    []
  );

  // 디바운스 래퍼
  const sendViewportQuery = useCallback(
    (q: {
      leftTop: LatLng;
      leftBottom: LatLng;
      rightTop: LatLng;
      rightBottom: LatLng;
      zoomLevel: number;
    }) => {
      // dev StrictMode에서 마운트 직후 이펙트 2회 보정용 (원치 않으면 제거)
      if (!ranOnceRef.current) {
        ranOnceRef.current = true;
      }
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => _send(q), 120);
    },
    [_send]
  );

  // 언마운트 클린업
  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { sendViewportQuery };
}
