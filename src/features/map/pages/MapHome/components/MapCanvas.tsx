"use client";

import * as React from "react";
import { PoiKind } from "@/features/map/components/overlays/poiOverlays";
import MapView from "../../../components/MapView/MapView";
import type { MapMarker } from "../../../types/map";
import { attachLabelRegistryGlobalHandlers } from "@/features/map/lib/labelRegistry";

export default function MapCanvas(props: {
  appKey: string;
  kakaoSDK: any;
  mapInstance: any;
  markers: MapMarker[];
  fitAllOnce?: any;
  poiKinds: readonly PoiKind[];
  pinsLoading?: boolean;
  pinsError?: string | null;
  menuOpen: boolean;
  menuAnchor?: { lat: number; lng: number } | null;
  hideLabelForId?: string | null;
  onMarkerClick?: (id: string) => void;
  onOpenMenu?: (args: any) => void;
  onChangeHideLabelForId?: (id?: string) => void;
  onMapReady?: (api: unknown) => void;
  onViewportChange?: (v: any) => void;
  isDistrictOn: boolean;
}) {
  const {
    appKey,
    markers,
    fitAllOnce,
    poiKinds,
    pinsLoading,
    pinsError,
    hideLabelForId,
    onMarkerClick,
    onOpenMenu,
    onChangeHideLabelForId,
    onMapReady,
    onViewportChange,
    isDistrictOn,
  } = props;

  // ✅ 전역 라벨 레지스트리 이벤트 핸들러 1회 연결
  React.useEffect(() => {
    attachLabelRegistryGlobalHandlers();
  }, []);

  // ✅ Map 인스턴스 보관(라벨 숨김 이벤트에 동봉)
  const mapRef = React.useRef<any>(null);

  const handleMapReady = React.useCallback(
    (api: any) => {
      // MapView가 무엇을 넘기는지에 따라 유연하게 보관
      mapRef.current = api?.map ?? api?.kakaoMap ?? api ?? null;
      onMapReady?.(api);
    },
    [onMapReady]
  );

  // ✅ 공통: 메뉴 오픈 시 근처 라벨 숨김 이벤트 발행
  const emitHideLabels = React.useCallback(
    (pos: { lat: number; lng: number }) => {
      try {
        if (typeof window !== "undefined" && "dispatchEvent" in window) {
          window.dispatchEvent(
            new CustomEvent("map:hide-labels-around", {
              detail: {
                map: mapRef.current,
                lat: pos.lat,
                lng: pos.lng,
                radiusPx: 40,
              },
            })
          );
        }
      } catch {}
    },
    []
  );

  return (
    <div className="absolute inset-0">
      <MapView
        appKey={appKey}
        center={{ lat: 37.5665, lng: 126.978 }}
        level={4}
        markers={markers}
        fitToMarkers={fitAllOnce}
        useDistrict={isDistrictOn}
        onMarkerClick={(id) => onMarkerClick?.(String(id))}
        onMapReady={handleMapReady}
        onViewportChange={onViewportChange}
        allowCreateOnMapClick={false}
        hideLabelForId={hideLabelForId}
        // ✅ 신규핀(지도 클릭으로 생성) 메뉴 오픈
        onDraftPinClick={(pos) => {
          emitHideLabels(pos);
          onOpenMenu?.({
            position: pos,
            propertyId: "__draft__",
            propertyTitle: "선택 위치",
            pin: { kind: "question", isFav: false },
          });
          onChangeHideLabelForId?.("__draft__");
        }}
        // ✅ 기존핀/주소검색 등 모든 메뉴 오픈 진입점
        onOpenMenu={({ position, propertyId, propertyTitle, pin }) => {
          if (position) emitHideLabels(position);
          onOpenMenu?.({ position, propertyId, propertyTitle, pin });
        }}
        poiKinds={poiKinds}
        showPoiToolbar={false}
      />

      {pinsLoading && (
        <div className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-xs shadow">
          Loading pins…
        </div>
      )}
      {pinsError && (
        <div className="absolute left-2 top-8 rounded bg-red-50 px-2 py-1 text-xs text-red-700 shadow">
          {pinsError}
        </div>
      )}
    </div>
  );
}
