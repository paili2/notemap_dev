"use client";

import { useClustererWithLabels } from "./hooks/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import useKakaoMap from "./hooks/useKakaoMap";
import { useMapClick } from "./hooks/useMapClick";
import type { MapViewProps } from "./types";
import type { PinKind } from "@/features/map/pins";
import { useEffect, useMemo } from "react";

type Props = MapViewProps & {
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
  pinKind = "1room",
}) => {
  const {
    containerRef,
    kakao,
    map,
    // ✅ 검색 쓰려면 이 두 개를 받아주세요
    searchPlace,
    // clearLastMarker,
  } = useKakaoMap({
    appKey,
    center,
    level,
    // ✅ 전국 보기 + 그 이상 축소 금지
    fitKoreaBounds: true,
    // (옵션) fitKoreaBounds가 false일 때 동작할 일반 최대 축소 한계
    maxLevel: 11,
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
    defaultPinKind: pinKind,
    fitToMarkers,
  });

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
