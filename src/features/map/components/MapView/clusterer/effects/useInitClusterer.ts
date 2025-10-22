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
    if (!isReady) return;

    if (!clustererRef.current) {
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: clusterMinLevel,
      });
    } else {
      try {
        clustererRef.current.setMinLevel?.(clusterMinLevel);
        clustererRef.current.setMap?.(map);
      } catch {}
    }

    const handler = (cluster: any) => {
      try {
        const center = cluster.getCenter();
        const nextLevel = Math.max(1, map.getLevel() - 1);
        map.setLevel(nextLevel, { anchor: center });
      } catch {}
    };

    kakao.maps.event.addListener(clustererRef.current, "clusterclick", handler);
    return () => {
      kakao?.maps?.event?.removeListener?.(
        clustererRef.current,
        "clusterclick",
        handler
      );
    };
  }, [isReady, kakao, map, clustererRef, clusterMinLevel]);
}
