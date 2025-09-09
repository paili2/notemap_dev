"use client";

import { useRef } from "react";
import { useClustererWithLabels } from "./hooks/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import useKakaoMap from "./hooks/useKakaoMap";
import { useMapClick } from "./hooks/useMapClick";
import type { MapViewProps } from "./types";
import type { PinKind } from "@/features/map/pins";

type Props = MapViewProps & {
  /** 헤더에서 선택한 핀 종류 (없으면 기본값 사용) */
  pinKind?: PinKind;
  /** 라벨 숨길 대상 핀 id (말풍선 열린 핀) */
  hideLabelForId?: string | null;
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
  onViewportChange,
  pinKind = "1room",
  hideLabelForId = null,
}) => {
  // idle 디바운스
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { containerRef, kakao, map } = useKakaoMap({
    appKey,
    center,
    level,
    fitKoreaBounds: true,
    maxLevel: 11,
    showNativeLayerControl,
    controlRightOffsetPx,
    controlTopOffsetPx,
    onMapReady,
    onViewportChange: (q) => {
      if (!onViewportChange) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => onViewportChange(q), 500);
    },
  });

  useDistrictOverlay(kakao, map, useDistrict);

  useMapClick(kakao, map, allowCreateOnMapClick ? onMapClick : undefined, {
    showNewMarker: false,
  });

  useClustererWithLabels(kakao, map, markers, {
    hitboxSizePx: 56,
    onMarkerClick,
    defaultPinKind: pinKind,
    fitToMarkers,
    hideLabelForId,
  });

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
