import type { LatLng } from "@/features/map/types/map";
import { PinKind } from "../../pins";

export type MapViewProps = {
  appKey: string;
  center: LatLng;
  level?: number;
  markers?: any[];
  fitToMarkers?: boolean;

  useDistrict?: boolean;
  showNativeLayerControl?: boolean;
  controlRightOffsetPx?: number;
  controlTopOffsetPx?: number;

  /** 지도 클릭으로 새 핀 생성 허용 여부 (기본 false: 금지) */
  allowCreateOnMapClick?: boolean;

  onMarkerClick?: (id: string) => void;
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  onMapReady?: (ctx: { map: any; kakao: any }) => void;

  pinKind?: PinKind;
};
