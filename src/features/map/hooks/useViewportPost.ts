"use client";

import { useCallback, useEffect, useRef } from "react";
import { LatLng } from "@/lib/geo/types";

export function useViewportPost() {
  const lastKeyRef = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = (n: number, p = 6) => {
    const f = 10 ** p;
    return Math.round(n * f) / f;
  };

  const _notify = useCallback(
    (q: {
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

      const EPS = 1e-6;
      if (neLat - swLat < EPS) {
        swLat = round(swLat - EPS);
        neLat = round(neLat + EPS);
      }
      if (neLng - swLng < EPS) {
        swLng = round(swLng - EPS);
        neLng = round(neLng + EPS);
      }

      const key = `${swLat},${swLng},${neLat},${neLng},z${q.zoomLevel}`;
      if (lastKeyRef.current === key) return; // 동일 파라미터 재호출 차단
      lastKeyRef.current = key;

      // 여기서는 오직 “보고/전달”만 수행 (예: 상태 저장, 분석 이벤트 등)
      if (process.env.NODE_ENV !== "production") {
        console.log("[viewport]", {
          swLat,
          swLng,
          neLat,
          neLng,
          zoom: q.zoomLevel,
        });
      }
    },
    []
  );

  const sendViewportQuery = useCallback(
    (q: {
      leftTop: LatLng;
      leftBottom: LatLng;
      rightTop: LatLng;
      rightBottom: LatLng;
      zoomLevel: number;
    }) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => _notify(q), 120);
    },
    [_notify]
  );

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    []
  );

  return { sendViewportQuery };
}
