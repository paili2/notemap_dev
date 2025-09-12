"use client";
import { useCallback, useEffect, useState } from "react";

type Args = {
  kakao: typeof kakao | null;
  map: kakao.maps.Map | null;
  target: kakao.maps.Marker | kakao.maps.LatLng | null;
  xAnchor?: number;
  yAnchor?: number;
};

/**
 * 지도 오버레이가 타겟(Marker/LatLng)에 맞춰 좌표를 따라가도록 하는 훅
 */
export function useOverlayPosition({
  kakao,
  map,
  target,
  xAnchor = 0.5,
  yAnchor = 1.1,
}: Args) {
  const [position, setPosition] = useState<kakao.maps.LatLng | null>(null);

  // 좌표 업데이트
  const recalc = useCallback(() => {
    if (!kakao || !map || !target) return;

    if (target instanceof kakao.maps.Marker) {
      setPosition(target.getPosition());
    } else if (target instanceof kakao.maps.LatLng) {
      setPosition(target);
    } else {
      setPosition(null);
    }
  }, [kakao, map, target]);

  // 최초 1회
  useEffect(() => {
    recalc();
  }, [recalc]);

  // 지도 이동/확대/축소, 브라우저 리사이즈 시 좌표 재계산
  useEffect(() => {
    if (!kakao || !map) return;
    kakao.maps.event.addListener(map, "idle", recalc);
    window.addEventListener("resize", recalc);

    return () => {
      kakao.maps.event.removeListener(map, "idle", recalc);
      window.removeEventListener("resize", recalc);
    };
  }, [kakao, map, recalc]);

  return { position, xAnchor, yAnchor };
}
