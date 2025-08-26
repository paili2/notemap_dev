import type { LatLng, MapMarker } from "@/features/map/types/map";

export type MapViewProps = {
  appKey: string;
  center: LatLng;
  level?: number;
  markers?: MapMarker[];
  fitToMarkers?: boolean;

  useDistrict?: boolean;
  showNativeLayerControl?: boolean;
  controlRightOffsetPx?: number;
  controlTopOffsetPx?: number;

  onMarkerClick?: (id: string) => void;
  onMapClick?: (latlng: LatLng) => void;
  onMapReady?: (ctx: { map: any; kakao: any }) => void;
};
