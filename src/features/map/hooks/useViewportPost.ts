// src/features/map/hooks/useViewportPost.ts
"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { LatLng } from "@/lib/geo/types";

type Viewport = {
  leftTop: LatLng;
  leftBottom: LatLng;
  rightTop: LatLng;
  rightBottom: LatLng;
  zoomLevel: number;
};

type UseViewportPostOptions = {
  /** 반올림 소수점 (기본 6) */
  precision?: number;
  /** 디바운스 ms (기본 120) */
  debounceMs?: number;
  /** 변경 통지 콜백 (보고/전달 지점) */
  onChange?: (params: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
    zoom: number;
    key: string;
  }) => void;
  /** 최소 bbox 폭/높이 보정값 (기본 1e-6) */
  minDelta?: number;
};

/** q 가 Viewport 형태인지 러프하게 체크 */
const isValidViewport = (q: any): q is Viewport => {
  if (!q) return false;
  const pts = [q.leftTop, q.leftBottom, q.rightTop, q.rightBottom];
  if (
    pts.some(
      (p) => !p || typeof p.lat !== "number" || typeof p.lng !== "number"
    )
  ) {
    return false;
  }
  if (typeof q.zoomLevel !== "number") return false;
  return true;
};

export function useViewportPost(opts: UseViewportPostOptions = {}) {
  const { precision = 6, debounceMs = 120, onChange, minDelta = 1e-6 } = opts;

  const lastKeyRef = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = useCallback(
    (n: number, p = precision) => {
      const f = 10 ** p;
      return Math.round(n * f) / f;
    },
    [precision]
  );

  const buildKey = useCallback(
    (
      swLat: number,
      swLng: number,
      neLat: number,
      neLng: number,
      zoom: number
    ) => `${swLat},${swLng},${neLat},${neLng},z${zoom}`,
    []
  );

  /** 내부 통지 함수 */
  const _notify = useCallback(
    (raw?: Viewport) => {
      // ✅ 최상단에서 Viewport 형태 검증
      if (!isValidViewport(raw)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[viewport] _notify called with invalid viewport:", raw);
        }
        return;
      }

      const q = raw;

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

      // NaN 가드
      if (
        lats.some((v) => !Number.isFinite(v)) ||
        lngs.some((v) => !Number.isFinite(v))
      ) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[viewport] invalid lat/lng", { lats, lngs, q });
        }
        return;
      }

      let swLat = round(Math.min(...lats));
      let swLng = round(Math.min(...lngs));
      let neLat = round(Math.max(...lats));
      let neLng = round(Math.max(...lngs));

      // 최소 박스 보정
      if (neLat - swLat < minDelta) {
        swLat = round(swLat - minDelta);
        neLat = round(neLat + minDelta);
      }
      if (neLng - swLng < minDelta) {
        swLng = round(swLng - minDelta);
        neLng = round(neLng + minDelta);
      }

      const zoom = q.zoomLevel;
      const key = buildKey(swLat, swLng, neLat, neLng, zoom);
      if (lastKeyRef.current === key) return; // 동일 파라미터 재호출 차단
      lastKeyRef.current = key;

      // 보고/전달 지점: 콜백 + 개발로그
      onChange?.({ swLat, swLng, neLat, neLng, zoom, key });
      if (process.env.NODE_ENV !== "production") {
        console.log("[viewport]", { swLat, swLng, neLat, neLng, zoom, key });
      }
    },
    [buildKey, minDelta, onChange, round]
  );

  const sendViewportQuery = useCallback(
    (q?: Viewport) => {
      if (!isValidViewport(q)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[viewport] sendViewportQuery called with invalid viewport:",
            q
          );
        }
        return;
      }
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => _notify(q), debounceMs);
    },
    [_notify, debounceMs]
  );

  // 즉시 송신(디바운스 무시)도 제공
  const flushViewport = useCallback(
    (q?: Viewport) => {
      if (!isValidViewport(q)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[viewport] flushViewport called with invalid viewport:",
            q
          );
        }
        return;
      }
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      _notify(q);
    },
    [_notify]
  );

  // 마지막 키 제공(디버깅/중복 확인용)
  const lastKey = useMemo(() => lastKeyRef.current, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { sendViewportQuery, flushViewport, lastKey };
}
