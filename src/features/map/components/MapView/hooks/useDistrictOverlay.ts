"use client";

import { useEffect } from "react";

export function useDistrictOverlay(
  kakao: typeof window.kakao | null,
  map: kakao.maps.Map | null,
  enabled: boolean = false
) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!kakao?.maps || !map) return;

    const id = kakao.maps.MapTypeId.USE_DISTRICT;

    if (enabled) {
      map.addOverlayMapTypeId(id);
    } else {
      // ✅ 체크 없이 바로 제거 (끄기 보장)
      map.removeOverlayMapTypeId(id);
    }

    // 언마운트 시 깔끔히 제거 (중복 호출해도 무해)
    return () => {
      map.removeOverlayMapTypeId(id);
    };
  }, [kakao, map, enabled]);
}
