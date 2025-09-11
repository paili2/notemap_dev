import { LatLng } from "@/lib/geo/types";

// kakao.maps.LatLng 과 호환되는 최소 형태(구조적 타이핑)
export type KakaoLatLngLike = { getLat(): number; getLng(): number };
type PlainLatLng = LatLng;

export type PinContextMenuProps = {
  kakao: any; // kakao SDK 루트
  map: any; // kakao.maps.Map
  // ✅ Marker까지 포함
  position: kakao.maps.Marker | KakaoLatLngLike | PlainLatLng | null;

  roadAddress?: string | null;
  jibunAddress?: string | null;
  propertyId?: string | null; // "__draft__" or 실제 id
  propertyTitle?: string | null; // 현재 매물명
  onClose: () => void;
  onView?: (id: string) => void;
  onCreate?: (id?: string) => void;
  offsetX?: number;
  offsetY?: number;
  zIndex?: number;
};

export type OverlayPoint = { left: number; top: number } | null;
