"use client";

import { useClustererWithLabels } from "./hooks/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import useKakaoMap from "./hooks/useKakaoMap";
import { useMapClick } from "./hooks/useMapClick";
import type { MapViewProps } from "./types";

const MapView: React.FC<MapViewProps> = ({
  appKey,
  center,
  level = 5,
  markers = [],
  fitToMarkers = false,
  useDistrict = false,
  showNativeLayerControl = false,
  controlRightOffsetPx = 0,
  controlTopOffsetPx = 0,
  onMarkerClick,
  onMapClick,
  onMapReady,
}) => {
  const { containerRef, kakao, map } = useKakaoMap({
    appKey,
    center,
    level,
    showNativeLayerControl,
    controlRightOffsetPx,
    controlTopOffsetPx,
    onMapReady,
  });

  useDistrictOverlay(kakao, map, useDistrict);
  // 클릭 시 임시 "신규 등록 위치"는 만들지 않음 (검색 시만 신규 분기)
  useMapClick(kakao, map, onMapClick, { showNewMarker: false });

  // ✅ 500m가 level 6인 환경 기준으로 경계 조정
  useClustererWithLabels(kakao, map, markers, {
    hitboxSizePx: 56,
    onMarkerClick,
  });

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
