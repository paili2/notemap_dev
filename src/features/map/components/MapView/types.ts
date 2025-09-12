import { PinKind } from "@/features/pins/types";
import { LatLng } from "@/lib/geo/types";
import { MapMarker } from "@/features/map/types/map";

export type MapViewportChange = {
  leftTop: LatLng;
  leftBottom: LatLng;
  rightTop: LatLng;
  rightBottom: LatLng;
  zoomLevel: number;
};

export type MapViewProps = {
  appKey: string;
  center: LatLng;
  level?: number;
  markers?: MapMarker[];
  fitToMarkers?: boolean;

  useDistrict?: boolean;

  /** 지도 클릭으로 새 핀 생성 허용 여부 (기본 false: 금지) */
  allowCreateOnMapClick?: boolean;

  onMarkerClick?: (id: string) => void;
  onMapClick?: (latlng: LatLng) => void;
  onMapReady?: (ctx: {
    map: kakao.maps.Map;
    kakao: typeof window.kakao;
  }) => void;

  /** 뷰포트 변경 시 4꼭짓점 + 줌레벨을 상위로 전달 */
  onViewportChange?: (q: MapViewportChange) => void;

  pinKind?: PinKind;
};
