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
  /** ✅ 기본값 false: 지도 클릭으로 생성 금지 */
  allowCreateOnMapClick = false,
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

  // ✅ 지도 클릭 리스너는 스위치 켜졌을 때만 바인딩
  if (allowCreateOnMapClick) {
    useMapClick(kakao, map, onMapClick, { showNewMarker: false });
  }

  useClustererWithLabels(kakao, map, markers, {
    hitboxSizePx: 56,
    onMarkerClick,
  });

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
