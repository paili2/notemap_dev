"use client";

import { useClustererWithLabels } from "./hooks/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import useKakaoMap from "./hooks/useKakaoMap";
import { useMapClick } from "./hooks/useMapClick";
import type { MapViewProps } from "./types";
import type { PinKind } from "@/features/map/pins";
import { useMemo } from "react";

// ✅ pinKind를 옵셔널로
type Props = MapViewProps & {
  /** 헤더에서 선택한 핀 종류 (없으면 기본값 사용) */
  pinKind?: PinKind;
};

const MapView: React.FC<Props> = ({
  appKey,
  center,
  level = 5,
  markers = [],
  fitToMarkers = false,
  useDistrict = false,
  showNativeLayerControl = false,
  controlRightOffsetPx = 0,
  controlTopOffsetPx = 0,
  allowCreateOnMapClick = false,
  onMarkerClick,
  onMapClick,
  onMapReady,
  pinKind = "1room", // ✅ 기본값
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

  const enableCreate = useMemo(
    () => allowCreateOnMapClick && markers.length === 0,
    [allowCreateOnMapClick, markers.length]
  );

  useMapClick(kakao, map, enableCreate ? onMapClick : undefined, {
    showNewMarker: false,
  });

  useClustererWithLabels(kakao, map, markers, {
    hitboxSizePx: 56,
    onMarkerClick,
    defaultPinKind: pinKind, // ✅ 각 마커에 kind가 없으면 이 기본 핀 사용
    fitToMarkers,
  });

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
