export type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string | number;
  position: LatLng;
  title?: string;
};

export type MapControls = {
  zoom?: boolean; // 우상단 줌 컨트롤
  mapType?: boolean; // 지도/스카이뷰 토글
};
