import { useEffect, useRef, useState } from "react";

// 간단 디바운스
function debounce<F extends (...args: any[]) => void>(fn: F, wait: number) {
  let t: any;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function equalBounds(a?: kakao.maps.LatLngBounds, b?: kakao.maps.LatLngBounds) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const asw = a.getSouthWest(),
    ane = a.getNorthEast();
  const bsw = b.getSouthWest(),
    bne = b.getNorthEast();
  return (
    asw.getLat() === bsw.getLat() &&
    asw.getLng() === bsw.getLng() &&
    ane.getLat() === bne.getLat() &&
    ane.getLng() === bne.getLng()
  );
}

export function useViewportBounds(
  kakaoSDK?: typeof kakao,
  map?: kakao.maps.Map | null
) {
  const [bounds, setBounds] = useState<kakao.maps.LatLngBounds | undefined>(
    undefined
  );

  useEffect(() => {
    if (!kakaoSDK || !map) return;
    const update = debounce(() => {
      const next = map.getBounds?.();
      if (!next) return;
      setBounds((prev) => (equalBounds(prev, next) ? prev : next));
    }, 150);

    // idle만 써도 충분. 필요시 center_changed/zoom_changed 제거
    kakao.maps.event.addListener(map, "idle", update);

    // 마운트 시 1회
    update();

    return () => {
      kakao.maps.event.removeListener(map, "idle", update as any);
    };
  }, [kakaoSDK, map]);

  return bounds; // 구독이 필요한 곳에서 사용
}
