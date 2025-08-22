"use client";

import { useKakaoMap } from "./hooks/useKakaoMap";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import { useMapClick } from "./hooks/useMapClick";
import { useMarkers } from "./hooks/useMarkers";
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
  useMapClick(kakao, map, onMapClick);
  useMarkers(kakao, map, markers, onMarkerClick, fitToMarkers);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
