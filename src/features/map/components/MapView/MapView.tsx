"use client";

import { useClustererWithLabels } from "./hooks/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import useKakaoMap from "./hooks/useKakaoMap";
import { useMapClick } from "./hooks/useMapClick";
import type { MapViewProps } from "./types";
import type { PinKind } from "@/features/map/pins";
import { useMemo, useRef } from "react";

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
  onViewportChange, // ✅ 상위로 전달받음
  pinKind = "1room",
}) => {
  // ✅ idle 디바운스
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { containerRef, kakao, map } = useKakaoMap({
    appKey,
    center,
    level,
    // 전국 보기 + 그 이상 축소 금지
    fitKoreaBounds: true,
    // fitKoreaBounds가 false일 때 일반 최대 축소
    maxLevel: 11,
    showNativeLayerControl,
    controlRightOffsetPx,
    controlTopOffsetPx,
    onMapReady,
    // ✅ idle 때마다 현재 뷰포트 4점 + 줌레벨 콜백
    onViewportChange: (q) => {
      if (!onViewportChange) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => onViewportChange(q), 500);
    },
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
