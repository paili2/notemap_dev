import { PinKind } from "@/features/pins/types";
import { LatLng } from "@/lib/geo/types";

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

  /** 뷰포트 변경 시 4꼭짓점 + 줌레벨을 상위로 전달 */
  onViewportChange?: (q: {
    leftTop: LatLng;
    leftBottom: LatLng;
    rightTop: LatLng;
    rightBottom: LatLng;
    zoomLevel: number;
  }) => void;

  pinKind?: PinKind;
};
