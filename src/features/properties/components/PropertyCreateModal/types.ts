import { CreatePayload } from "@/features/properties/types/property-dto";

export type PropertyCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (
    payload: CreatePayload,
    result?: { id: string; matchedDraftId: number | null }
  ) => void | Promise<void>;
  initialAddress?: string;
  addressLocked?: boolean;
  initialLat?: number;
  initialLng?: number;
};
