import * as React from "react";
import type { LatLng } from "@/features/map/types/map";
import type { OverlayPoint } from "./types";

/**
 * Kakao Map 좌표(lat/lng)를 현재 지도 컨테이너의 픽셀 좌표로 변환하고
 * 지도 이벤트/윈도우 리사이즈에 반응해 값을 갱신합니다.
 */
export function useOverlayPosition(params: {
  kakao: any;
  map: any;
  position: LatLng;
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
      const latlng = new kakao.maps.LatLng(position.lat, position.lng);
      const containerPt = proj.containerPointFromCoords(latlng);
      setPt({
        left: Math.round(containerPt.x + offsetX),
        top: Math.round(containerPt.y + offsetY),
      });
    } catch {
      /* noop */
    }
  }, [kakao, map, position.lat, position.lng, offsetX, offsetY]);

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

  return pt;
}
