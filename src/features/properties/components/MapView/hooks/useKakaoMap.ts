// SDK 로드 + 맵 생성 + 컨트롤 + onMapReady

"use client";

import { useEffect, useRef } from "react";
import { loadKakaoMaps } from "@/lib/kakaoLoader";
import type { LatLng } from "@/features/properties/types/map";

type Args = {
  appKey: string;
  center: LatLng;
  level?: number;
  showNativeLayerControl?: boolean;
  controlRightOffsetPx?: number;
  controlTopOffsetPx?: number;
  onMapReady?: (ctx: { map: any; kakao: any }) => void;
};

export function useKakaoMap({
  appKey,
  center,
  level = 5,
  showNativeLayerControl = false,
  controlRightOffsetPx = 0,
  controlTopOffsetPx = 0,
  onMapReady,
}: Args) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const kakaoRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const initedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (initedRef.current) return;

        const kakao = await loadKakaoMaps(appKey, ["services"]);
        if (cancelled || !containerRef.current) return;

        kakaoRef.current = kakao;

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });
        mapRef.current = map;
        initedRef.current = true;

        // 기본 컨트롤
        if (showNativeLayerControl) {
          const mapTypeControl = new kakao.maps.MapTypeControl();
          const zoomControl = new kakao.maps.ZoomControl();
          map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);
          map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
        }

        // 컨테이너 padding 보정
        if (containerRef.current) {
          containerRef.current.style.paddingRight = controlRightOffsetPx
            ? `${controlRightOffsetPx}px`
            : "";
          containerRef.current.style.paddingTop = controlTopOffsetPx
            ? `${controlTopOffsetPx}px`
            : "";
        }

        // 첫 프레임 보정 + idle 1회 relayout
        setTimeout(() => {
          map.relayout?.();
          kakao.maps.event.trigger(map, "resize");
        }, 0);
        const once = kakao.maps.event.addListener(map, "idle", () => {
          map.relayout?.();
          kakao.maps.event.removeListener(map, "idle", once);
        });

        onMapReady?.({ map, kakao });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Kakao maps init failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    appKey,
    center.lat,
    center.lng,
    level,
    showNativeLayerControl,
    controlRightOffsetPx,
    controlTopOffsetPx,
    onMapReady,
  ]);

  return { containerRef, kakao: kakaoRef.current, map: mapRef.current };
}
