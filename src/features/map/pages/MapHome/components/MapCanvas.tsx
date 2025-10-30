"use client";

import { PoiKind } from "@/features/map/components/overlays/poiOverlays";
import MapView from "../../../components/MapView/MapView";
import type { MapMarker } from "../../../types/map";

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
        onMapReady={onMapReady}
        onViewportChange={onViewportChange}
        allowCreateOnMapClick={false}
        hideLabelForId={hideLabelForId}
        onDraftPinClick={(pos) => {
          onOpenMenu?.({
            position: pos,
            propertyId: "__draft__",
            propertyTitle: "선택 위치",
            pin: { kind: "question", isFav: false },
          });
          onChangeHideLabelForId?.("__draft__");
        }}
        onOpenMenu={({ position, propertyId, propertyTitle, pin }) =>
          onOpenMenu?.({ position, propertyId, propertyTitle, pin })
        }
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
