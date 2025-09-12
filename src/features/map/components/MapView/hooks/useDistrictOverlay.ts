// 지적편집도 on/off

"use client";

import { useEffect } from "react";

export function useDistrictOverlay(
  kakao: typeof window.kakao | null,
  map: kakao.maps.Map | null,
  useDistrict: boolean = false
) {
  useEffect(() => {
    if (!kakao || !map) return;

    if (useDistrict) {
      map.addOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
    } else {
      map.removeOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
    }
  }, [kakao, map, useDistrict]);
}
