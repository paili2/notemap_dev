import type { PinKind } from "@/features/pins/types";

export type PropertyCreateResult = {
  pinId: string;
  matchedDraftId: number | null;
  lat: number;
  lng: number;
  payload?: any;
};

export type PropertyCreateModalProps = {
  open: boolean;
  createPinKind?: PinKind | null;
  initialAddress?: string;

  /** 클릭된 기존 핀의 좌표(절대 고정값) */
  initialLat: number;
  initialLng: number;

  onClose: () => void;
  onSubmit: (r: PropertyCreateResult) => void;

  /** 임시핀 id (문자/숫자 둘 다 가능) */
  pinDraftId?: number | string;

  /** 상위에서 내려주는 기본 핀 종류 (없으면 Body에서 답사예정(question)으로 기본 설정) */
  initialPinKind?: PinKind | null;
};
