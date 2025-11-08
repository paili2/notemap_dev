"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

  // rAF 스로틀용
  const rafRef = useRef<number | null>(null);

  const equalLatLng = useCallback(
    (a: kakao.maps.LatLng | null, b: kakao.maps.LatLng | null) => {
      if (!a || !b) return a === b;
      return a.getLat() === b.getLat() && a.getLng() === b.getLng();
    },
    []
  );

  const getCurrentTargetPos = useCallback((): kakao.maps.LatLng | null => {
    if (!kakao || !target) return null;
    if (target instanceof kakao.maps.Marker) return target.getPosition();
    if (target instanceof kakao.maps.LatLng) return target;
    return null;
  }, [kakao, target]);

  const recalc = useCallback(() => {
    if (!kakao || !map) return;

    const next = getCurrentTargetPos();
    setPosition((prev) => (equalLatLng(prev, next) ? prev : next));
  }, [kakao, map, getCurrentTargetPos, equalLatLng]);

  // rAF로 스로틀된 재계산
  const recalcWithRAF = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      recalc();
    });
  }, [recalc]);

  // 최초 1회
  useEffect(() => {
    recalc();
    // cleanup: 남아있는 rAF 취소
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [recalc]);

  // 지도 idle / 브라우저 리사이즈 시 좌표 갱신
  useEffect(() => {
    if (!kakao || !map) return;

    kakao.maps.event.addListener(map, "idle", recalcWithRAF);
    window.addEventListener("resize", recalcWithRAF);

    return () => {
      kakao.maps.event.removeListener(map, "idle", recalcWithRAF);
      window.removeEventListener("resize", recalcWithRAF);
    };
  }, [kakao, map, recalcWithRAF]);

  // 타겟이 Marker인 경우: 드래그가 끝나면 좌표 갱신
  useEffect(() => {
    if (!kakao || !target || !(target instanceof kakao.maps.Marker)) return;

    kakao.maps.event.addListener(target, "dragend", recalcWithRAF);
    return () => {
      kakao.maps.event.removeListener(target, "dragend", recalcWithRAF);
    };
  }, [kakao, target, recalcWithRAF]);

  // x/y 앵커는 불변값처럼 취급(메모)
  const anchors = useMemo(() => ({ xAnchor, yAnchor }), [xAnchor, yAnchor]);

  return { position, ...anchors };
}
