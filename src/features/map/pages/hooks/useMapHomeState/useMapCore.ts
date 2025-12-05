"use client";

import { useCallback, useRef, useState } from "react";
import type { Viewport } from "./mapHome.types";
import { sameViewport } from "./mapHome.utils";

type Bounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

type UseMapCoreArgs = {
  postViewport: any; // useViewportPost 결과
  setBounds: (b: Bounds) => void;
  refetch: () => void;
};

export function useMapCore({
  postViewport,
  setBounds,
  refetch,
}: UseMapCoreArgs) {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [kakaoSDK, setKakaoSDK] = useState<any>(null);

  const lastViewportRef = useRef<Viewport | null>(null);

  const sendViewportQuery = useCallback(
    (vp: Viewport, opts?: { force?: boolean }) => {
      // 같은 뷰포트면 중복 호출 방지
      if (!opts?.force && sameViewport(vp, lastViewportRef.current)) return;
      lastViewportRef.current = vp;

      // /viewport POST
      (postViewport as any)?.sendViewportQuery
        ? (postViewport as any).sendViewportQuery(vp)
        : (postViewport as any)(vp);

      // ❌ 여기서는 idle 이벤트를 강제로 쏘지 않는다
      //    핀 조회는 usePinsFromViewport의 idle 리스너 한 곳에서만 담당

      // bounds 상태 업데이트
      try {
        const sw = vp.leftBottom;
        const ne = vp.rightTop;
        setBounds({
          swLat: sw.lat,
          swLng: sw.lng,
          neLat: ne.lat,
          neLng: ne.lng,
        });
      } catch {}
    },
    [postViewport, setBounds]
  );

  const onViewportChange = useCallback(
    (vp: any, opts?: { force?: boolean }) => sendViewportQuery(vp, opts),
    [sendViewportQuery]
  );

  const onMapReady = useCallback(
    ({ kakao, map }: any) => {
      setKakaoSDK(kakao);
      setMapInstance(map);

      setTimeout(() => {
        map.relayout?.();
        kakao.maps.event.trigger(map, "resize");
        kakao.maps.event.trigger(map, "idle");
      }, 0);

      try {
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        setBounds({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        });
        refetch();
      } catch {}
    },
    [refetch, setBounds]
  );

  const lastViewport = lastViewportRef.current;

  return {
    kakaoSDK,
    mapInstance,
    sendViewportQuery,
    onViewportChange,
    onMapReady,
    lastViewport,
    lastViewportRef,
  } as const;
}
