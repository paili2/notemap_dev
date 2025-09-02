// 지적편집도 on/off

"use client";

import { useEffect } from "react";

export function useDistrictOverlay(
  kakao: any,
  map: any,
  useDistrict?: boolean
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
