export type PropertyCreateResult = {
  pinId: string;
  matchedDraftId: number | null;
  lat: number;
  lng: number;
  payload?: any;
};

export type PropertyCreateModalProps = {
  open: boolean;
  initialAddress?: string;
  /** 클릭된 기존 핀의 좌표(절대 고정값) */
  initialLat: number;
  initialLng: number;
  onClose: () => void;
  onSubmit: (r: PropertyCreateResult) => void;
  pinDraftId?: number | string;
};
