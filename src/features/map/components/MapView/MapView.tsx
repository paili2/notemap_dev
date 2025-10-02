"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useClustererWithLabels } from "./hooks/useClustererWithLabels";
import { useDistrictOverlay } from "./hooks/useDistrictOverlay";
import useKakaoMap from "./hooks/useKakaoMap";
import type { MapViewProps } from "./types";
import { PinKind } from "@/features/pins/types";

// ▼ POI
import { usePoiLayer } from "../../hooks/usePoiLayer";
// (옵션) 내부 토글 UI 쓰고 싶을 때만 사용
import { PoiLayerToggle } from "../PoiLayerToggle";
import { PoiKind } from "../../lib/poiOverlays";

type Props = MapViewProps & {
  /** 헤더에서 선택한 핀 종류 (없으면 기본값 사용) */
  pinKind?: PinKind;
  /** 라벨 숨길 대상 핀 id (말풍선 열린 핀) */
  hideLabelForId?: string | null;
  onDraftPinClick?: (pos: { lat: number; lng: number }) => void;

  /** 외부 제어형 주변시설 종류 */
  poiKinds?: PoiKind[];
  /** 내부 툴바 노출 여부(기본 false; 메뉴에서 제어 시 false 권장) */
  showPoiToolbar?: boolean;
};

/** MapHomeUI에서 접근 가능한 공개 메서드들 */
export type MapViewHandle = {
  /** 카카오 Places/주소 검색 → 맵 이동/마커/콜백 */
  searchPlace: (
    q: string,
    opts?: {
      clearPrev?: boolean;
      recenter?: boolean;
      fitZoom?: boolean;
      preferStation?: boolean;
      onFound?: (pos: { lat: number; lng: number }) => void;
    }
  ) => void;
  /** 맵을 특정 좌표로 이동 */
  panTo: (p: { lat: number; lng: number }) => void;
};

const MapView = React.forwardRef<MapViewHandle, Props>(function MapView(
  {
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

    // ▼ 새로 추가된 외부 제어형 props
    poiKinds = [],
    showPoiToolbar = false,
  },
  ref
) {
  // idle 디바운스
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_DEBOUNCE_MS = 500;

  const { containerRef, kakao, map, searchPlace, panTo } = useKakaoMap({
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

  // 🔓 외부로 메서드 노출
  useImperativeHandle(
    ref,
    () => ({
      searchPlace,
      panTo,
    }),
    [searchPlace, panTo]
  );

  useDistrictOverlay(kakao, map, useDistrict);

  // ▼ 주변시설 레이어 (외부 상태 사용)
  usePoiLayer({
    kakaoSDK: kakao,
    map,
    enabledKinds: poiKinds,
    maxResultsPerKind: 80,
    // 500m 체감 게이트
    minViewportEdgeMeters: 1000,
    showAtOrBelowLevel: 6,
  });

  // 지도 클릭으로 생성 허용 시
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

  const handleMarkerClick = useCallback(
    (id: string) => {
      if (id === "__draft__") {
        const draft = markers.find((m) => String(m.id) === "__draft__");
        if (draft && onDraftPinClick) {
          onDraftPinClick(draft.position);
        } else if (map && onDraftPinClick && kakao) {
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

  return (
    <div className="relative w-full h-full">
      {/* 옵션: 내부 툴바를 계속 쓰고 싶다면 showPoiToolbar=true 로 */}
      {showPoiToolbar && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur rounded-xl p-2 shadow">
          <PoiLayerToggle
            value={poiKinds}
            onChange={() => {
              /* 외부 제어형이므로 여기서 상태 변경은 하지 않음 */
            }}
          />
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

export default MapView;
