"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type Args = {
  kakao: typeof kakao | null;
  map: kakao.maps.Map | null;
  target: kakao.maps.Marker | kakao.maps.LatLng | null;
  xAnchor?: number;
  yAnchor?: number;
};

export function useOverlayPosition({
  kakao,
  map,
  target,
  xAnchor = 0.5,
  yAnchor = 1.1,
}: Args) {
  const [position, setPosition] = useState<kakao.maps.LatLng | null>(null);

  // target → LatLng 변환
  const currentLatLng = useMemo(() => {
    if (!kakao || !target) return null;
    if (target instanceof kakao.maps.Marker) return target.getPosition();
    return target;
  }, [kakao, target]);

  // 좌표 업데이트 함수
  const recalc = useCallback(() => {
    if (!kakao || !map || !currentLatLng) return;
    setPosition(currentLatLng);
  }, [kakao, map, currentLatLng]);

  // 최초 1회 실행
  useEffect(() => {
    recalc();
  }, [recalc]);

  // 👇 여기 이 useEffect 블록이 들어갑니다!
  useEffect(() => {
    if (!kakao || !map) return;
    const handler = () => recalc();

    kakao.maps.event.addListener(map, "idle", handler);
    window.addEventListener("resize", handler);

    return () => {
      kakao.maps.event.removeListener(map, "idle", handler);
      window.removeEventListener("resize", handler);
    };
  }, [kakao, map, recalc]);

  return { position, xAnchor, yAnchor };
}
