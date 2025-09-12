export type CustomOverlayProps = {
  kakao: typeof window.kakao | null;
  map: kakao.maps.Map | null;
  position: kakao.maps.LatLng;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
  className?: string;
  /** 오버레이 내부 포인터 이벤트 허용 여부 (기본 true) */
  pointerEventsEnabled?: boolean;
  children: React.ReactNode;
};
