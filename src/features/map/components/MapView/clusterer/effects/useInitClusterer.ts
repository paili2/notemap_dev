"use client";

import { useEffect } from "react";

export function useInitClusterer(
  isReady: boolean,
  kakao: any,
  map: any,
  clustererRef: React.MutableRefObject<any>,
  clusterMinLevel: number
) {
  useEffect(() => {
    if (!isReady || !kakao || !map) return;

    // 공통 원형 배지 스타일 (외부 이미지 X)
    const baseCircle = ({
      size,
      fontSize,
      lineHeight,
    }: {
      size: number;
      fontSize: number;
      lineHeight: number;
    }) => ({
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: "rgba(59,130,246,0.92)",
      color: "#fff",
      fontWeight: "700",
      textAlign: "center" as const,
      lineHeight: `${lineHeight}px`,
      fontSize: `${fontSize}px`,
      border: "1px solid rgba(0,0,0,0.2)",
      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
    });

    const styles = [
      baseCircle({ size: 28, fontSize: 12, lineHeight: 28 }),
      baseCircle({ size: 34, fontSize: 13, lineHeight: 34 }),
      baseCircle({ size: 42, fontSize: 14, lineHeight: 42 }),
      baseCircle({ size: 50, fontSize: 15, lineHeight: 50 }),
    ];
    const calculator = [10, 50, 100];

    // ✅ 이전 인스턴스가 있었다면 완전 정리
    if (clustererRef.current) {
      try {
        clustererRef.current.clear?.();
        clustererRef.current.setMap?.(null);
      } catch {}
    }

    // ✅ imagePath 명시(안전)
    clustererRef.current = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: clusterMinLevel,
      disableClickZoom: false,
      calculator,
      styles,
      imagePath:
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerCluster",
    });

    const handler = (cluster: any) => {
      try {
        const center = cluster.getCenter();
        const nextLevel = Math.max(1, map.getLevel() - 1);
        map.setLevel(nextLevel, { anchor: center });
      } catch {}
    };

    kakao.maps.event.addListener(clustererRef.current, "clusterclick", handler);
    return () => {
      try {
        kakao?.maps?.event?.removeListener?.(
          clustererRef.current,
          "clusterclick",
          handler
        );
        clustererRef.current?.clear?.();
        clustererRef.current?.setMap?.(null);
      } catch {}
    };
  }, [isReady, kakao, map, clustererRef, clusterMinLevel]);
}
