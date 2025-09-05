"use client";

import * as React from "react";
import type { OverlayPoint, KakaoLatLngLike } from "./types";
import type { LatLng } from "@/features/map/types/map";

/**
 * Kakao Map 좌표(lat/lng 또는 kakao.LatLng)를 현재 지도 컨테이너의 픽셀 좌표로 변환.
 * 지도 이벤트/윈도우 리사이즈에도 반응해 갱신.
 */
export function useOverlayPosition(params: {
  kakao: any;
  map: any;
  position: KakaoLatLngLike | LatLng; // kakao.LatLng | {lat,lng}
  offsetX?: number;
  offsetY?: number;
}): OverlayPoint {
  const { kakao, map, position, offsetX = 12, offsetY = -12 } = params;
  const [pt, setPt] = React.useState<OverlayPoint>(null);

  const recalc = React.useCallback(() => {
    try {
      if (!kakao || !map) return;
      const proj = map.getProjection?.();
      if (!proj) return;

      const K = kakao.maps;
      const isKakaoLatLng =
        position &&
        (position instanceof K.LatLng ||
          typeof (position as any).getLat === "function");

      const latlng = isKakaoLatLng
        ? (position as any)
        : new K.LatLng((position as LatLng).lat, (position as LatLng).lng);

      // SDK 버전에 따라 containerPointFromCoords 또는 pointFromCoords
      const containerPt = proj.containerPointFromCoords
        ? proj.containerPointFromCoords(latlng)
        : proj.pointFromCoords(latlng);

      setPt({
        left: Math.round(containerPt.x + offsetX),
        top: Math.round(containerPt.y + offsetY),
      });
    } catch {
      setPt(null);
    }
  }, [kakao, map, position, offsetX, offsetY]);

  React.useEffect(() => {
    recalc();
    if (!kakao || !map) return;

    const listeners: Array<{ target: any; type: string; handler: () => void }> =
      [];
    const add = (type: string, handler: () => void) => {
      kakao.maps.event.addListener(map, type, handler);
      listeners.push({ target: map, type, handler });
    };

    add("center_changed", recalc);
    add("zoom_changed", recalc);
    add("bounds_changed", recalc);
    add("tileloaded", recalc);

    const handleResize = () => recalc();
    window.addEventListener("resize", handleResize);

    return () => {
      listeners.forEach(({ target, type, handler }) => {
        kakao.maps.event.removeListener(target, type, handler);
      });
      window.removeEventListener("resize", handleResize);
    };
  }, [kakao, map, recalc]);

  // position 변경 시 즉시 재계산
  React.useEffect(() => {
    recalc();
  }, [recalc, position]);

  return pt;
}
