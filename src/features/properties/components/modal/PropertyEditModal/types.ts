import { UpdatePayload } from "@/features/properties/types/property-dto";
import { PropertyViewItem } from "@/features/properties/types/property-view";

export type PropertyEditModalProps = {
  open: boolean;
  item: PropertyViewItem;
  onClose: () => void;
  onSubmit?: (data: UpdatePayload) => void | Promise<void>;
};
