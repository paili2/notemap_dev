import type { LatLng } from "@/features/map/types/map";

// kakao.maps.LatLng 과 호환되는 최소 형태(구조적 타이핑)
export type KakaoLatLngLike = { getLat(): number; getLng(): number };

export type PinContextMenuProps = {
  kakao: any;
  map: any;
  // kakao.maps.LatLng 또는 {lat,lng} 둘 다 허용
  position: KakaoLatLngLike | LatLng;
  address?: string;
  propertyId?: string; // "__draft__" 포함
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
  offsetX?: number;
  offsetY?: number;
  zIndex?: number;
};

export type OverlayPoint = { left: number; top: number } | null;
