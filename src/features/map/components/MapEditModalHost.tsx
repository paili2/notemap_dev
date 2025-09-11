"use client";

import PropertyEditModal from "@/features/properties/components/PropertyEditModal/PropertyEditModal";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { buildEditPatchWithMedia } from "@/features/properties/components/PropertyEditModal/lib/buildEditPatch";

import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { applyPatchToItem } from "@/features/properties/lib/view/applyPatchToItem";

type Props = {
  open: boolean;
  data: PropertyViewDetails;
  selectedId: string;
  onClose: () => void;
  updateItems: (updater: (prev: PropertyItem[]) => PropertyItem[]) => void;
};

export default function MapEditModalHost({
  open,
  data,
  selectedId,
  onClose,
  updateItems,
}: Props) {
  return (
    <PropertyEditModal
      open={open}
      initialData={data}
      onClose={onClose}
      onSubmit={async (payload) => {
        const patch = await buildEditPatchWithMedia(payload, selectedId);
        updateItems((prev) =>
          prev.map((p) =>
            p.id === selectedId ? applyPatchToItem(p, patch) : p
          )
        );
        onClose();
      }}
    />
  );
}
