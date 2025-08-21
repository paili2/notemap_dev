import { LatLng } from "../MapView";

export type PinMode = "existing" | "draft";

export type PinContextMenuProps = {
  kakao: any;
  map: any;
  position: LatLng; // 메뉴를 붙일 핀 좌표
  address?: string; // 표시할 주소
  propertyId?: string; // 기존 핀일 때만 ID(있으면 '매물 보기' 노출)

  onClose: () => void;
  onView: (id: string) => void; // 매물 보기
  onCreate?: () => void; // 매물 생성

  zIndex?: number;
  offsetX?: number; // 핀 기준 +X
  offsetY?: number; // 핀 기준 +Y (위로는 음수)
};

export type OverlayUIProps = {
  address?: string | null;
  mode: PinMode;
  propertyId?: string | null;
  onClose: () => void;
  onView?: (id: string) => void;
  onCreate?: () => void;
  onDelete?: (id: string) => void;
};
