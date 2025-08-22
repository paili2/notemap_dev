import type { LatLng } from "@/features/properties/types/map";

export type PinContextMenuProps = {
  kakao: any;
  map: any;
  position: LatLng;
  address?: string;
  propertyId?: string;
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
  offsetX?: number;
  offsetY?: number;
  zIndex?: number;
};

export type OverlayPoint = { left: number; top: number } | null;
