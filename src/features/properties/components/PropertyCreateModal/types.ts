import type { CreatePayload } from "@/features/properties/types/property-dto";

export type PropertyCreateResult = {
  pinId: string;
  matchedDraftId: number | null;
  lat: number;
  lng: number;
  /** 필요하면 자식이 넘겨주는 원본 payload (선택) */
  payload?: CreatePayload;
};

export type PropertyCreateModalProps = {
  open: boolean;
  onClose: () => void;
  /** ✅ 자식이 /pins 생성 후 결과만 넘김. 부모는 절대 다시 POST 금지 */
  onSubmit?: (result: PropertyCreateResult) => void | Promise<void>;
  initialAddress?: string;
  addressLocked?: boolean;
  initialLat?: number;
  initialLng?: number;
};
