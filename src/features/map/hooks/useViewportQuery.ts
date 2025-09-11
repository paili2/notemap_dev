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
    async (q: {
      leftTop: LatLng;
      leftBottom: LatLng;
      rightTop: LatLng;
      rightBottom: LatLng;
      zoomLevel: number;
    }) => {
      const key = JSON.stringify({
        lt: { lat: round(q.leftTop.lat), lng: round(q.leftTop.lng) },
        lb: { lat: round(q.leftBottom.lat), lng: round(q.leftBottom.lng) },
        rt: { lat: round(q.rightTop.lat), lng: round(q.rightTop.lng) },
        rb: { lat: round(q.rightBottom.lat), lng: round(q.rightBottom.lng) },
        z: q.zoomLevel,
      });
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      if (inFlightRef.current) {
        inFlightRef.current.abort();
        inFlightRef.current = null;
      }
      const ac = new AbortController();
      inFlightRef.current = ac;

      try {
        const res = await fetch("/api/pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(q),
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[/api/pins] viewport fetch failed:", err);
        }
      } finally {
        if (inFlightRef.current === ac) inFlightRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (inFlightRef.current) inFlightRef.current.abort();
    };
  }, []);

  return { sendViewportQuery };
}
