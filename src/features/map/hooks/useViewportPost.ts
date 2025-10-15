"use client";

import { LatLng } from "@/lib/geo/types";
import { useCallback, useRef, useEffect } from "react";
import { api } from "@/shared/api/api";

export function useViewportPost() {
  const inFlightRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string | null>(null);

  const round = (n: number, p = 6) => {
    const f = Math.pow(10, p);
    return Math.round(n * f) / f;
  };

  const sendViewportQuery = useCallback(
    async (q: {
      leftTop: LatLng;
      leftBottom: LatLng;
      rightTop: LatLng;
      rightBottom: LatLng;
      zoomLevel: number;
    }) => {
      // 뷰포트 → SW/NE
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

      // ✅ 면적 0 방지
      const EPS = 1e-6;
      if (neLat - swLat < EPS) {
        swLat = round(swLat - EPS);
        neLat = round(neLat + EPS);
      }
      if (neLng - swLng < EPS) {
        swLng = round(swLng - EPS);
        neLng = round(neLng + EPS);
      }

      const key = `${swLat},${swLng},${neLat},${neLng}`;
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      // 진행 중 요청 취소
      inFlightRef.current?.abort();
      const ac = new AbortController();
      inFlightRef.current = ac;

      try {
        // 디버그: 실제 파라미터 확인
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[/pins/map] params →", {
            swLat,
            swLng,
            neLat,
            neLng,
            draftState: "all",
          });
        }

        await api.get("pins/map", {
          params: { swLat, swLng, neLat, neLng, draftState: "all" },
          signal: ac.signal,
        });
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

  useEffect(() => () => inFlightRef.current?.abort(), []);

  return { sendViewportQuery };
}
