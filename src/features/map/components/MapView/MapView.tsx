"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClustererWithLabels } from "./hooks/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import useKakaoMap from "./hooks/useKakaoMap";
import type { MapViewProps } from "./types";
import { PinKind } from "@/features/pins/types";

type Props = MapViewProps & {
  pinKind?: PinKind;
  hideLabelForId?: string | null;
  onDraftPinClick?: (pos: { lat: number; lng: number }) => void;
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
  onDraftPinClick,
  onMapClick,
  onMapReady,
  onViewportChange,
  pinKind = "1room",
  hideLabelForId = null,
}) => {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_DEBOUNCE_MS = 500;

  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const { containerRef, kakao, map } = useKakaoMap({
    appKey,
    center,
    level,
    fitKoreaBounds: true,
    maxLevel: 11,
    onMapReady,
    onViewportChange: (q) => {
      if (!onViewportChange) return;
      if (draggingRef.current) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(
        () => onViewportChange(q),
        IDLE_DEBOUNCE_MS
      );
    },
  });

  useDistrictOverlay(kakao, map, useDistrict);

  useEffect(() => {
    if (!map) return;
    try {
      map.setDraggable(true);
      map.setZoomable(true);
    } catch {}
  }, [map]);

  useEffect(() => {
    if (!kakao || !map) return;
    const onStart = () => {
      draggingRef.current = true;
      setDragging(true);
    };
    const onEnd = () => {
      draggingRef.current = false;
      setTimeout(() => setDragging(false), 0);
    };
    kakao.maps.event.addListener(map, "dragstart", onStart);
    kakao.maps.event.addListener(map, "dragend", onEnd);
    return () => {
      kakao.maps.event.removeListener(map, "dragstart", onStart);
      kakao.maps.event.removeListener(map, "dragend", onEnd);
    };
  }, [kakao, map]);

  useEffect(() => {
    if (!kakao || !map) return;
    if (!allowCreateOnMapClick || !onMapClick) return;
    const handler = (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      onMapClick({ lat: latlng.getLat(), lng: latlng.getLng() });
    };
    kakao.maps.event.addListener(map, "click", handler);
    return () => kakao.maps.event.removeListener(map, "click", handler);
  }, [kakao, map, allowCreateOnMapClick, onMapClick]);

  const handleMarkerClick = useCallback(
    (id: string) => {
      if (id === "__draft__") {
        const draft = markers.find((m) => String(m.id) === "__draft__");
        if (draft && onDraftPinClick) onDraftPinClick(draft.position);
        else if (map && onDraftPinClick && kakao) {
          const c = map.getCenter();
          onDraftPinClick({ lat: c.getLat(), lng: c.getLng() });
        }
        return;
      }
      onMarkerClick?.(id);
    },
    [markers, onDraftPinClick, onMarkerClick, map, kakao]
  );

  useClustererWithLabels(kakao, map, markers, {
    hitboxSizePx: 56,
    onMarkerClick: handleMarkerClick,
    defaultPinKind: pinKind,
    fitToMarkers: fitToMarkers && !dragging,
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: "auto", overscrollBehavior: "none" }}
    />
  );
};

export default MapView;
