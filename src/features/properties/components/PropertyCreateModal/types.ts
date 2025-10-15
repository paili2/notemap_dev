import { CreatePayload } from "@/features/properties/types/property-dto";

export type PropertyCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: CreatePayload) => void | Promise<void>;
  initialAddress?: string;
  addressLocked?: boolean;
};
