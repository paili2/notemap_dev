"use client";

import { useEffect, useRef } from "react";
import { useClustererWithLabels } from "./hooks/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import useKakaoMap from "./hooks/useKakaoMap";
import { useMapClick } from "./hooks/useMapClick";
import type { MapViewProps } from "./types";
import { PinKind } from "@/features/pins/types";

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

  const IDLE_DEBOUNCE_MS = 500;

  const { containerRef, kakao, map } = useKakaoMap({
    appKey,
    center,
    level,
    fitKoreaBounds: true,
    maxLevel: 11,
    onMapReady,
    onViewportChange: (q) => {
      if (!onViewportChange) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(
        () => onViewportChange(q),
        IDLE_DEBOUNCE_MS
      );
    },
  });
  useDistrictOverlay(kakao, map, useDistrict);

  useEffect(() => {
    if (!kakao || !map) return;
    if (!allowCreateOnMapClick || !onMapClick) return;

    const handler = (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      onMapClick({
        lat: latlng.getLat(),
        lng: latlng.getLng(),
      });
    };

    kakao.maps.event.addListener(map, "click", handler);
    return () => kakao.maps.event.removeListener(map, "click", handler);
  }, [kakao, map, allowCreateOnMapClick, onMapClick]);

  useClustererWithLabels(kakao, map, markers, {
    hitboxSizePx: 56,
    onMarkerClick,
    defaultPinKind: pinKind,
    fitToMarkers,
    hideLabelForId,
  });

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
