"use client";

import PropertyCreateModal from "@/features/properties/components/PropertyCreateModal/PropertyCreateModal";
import type { CreatePayload } from "@/features/properties/types/property-dto";
import type { LatLng } from "@/features/map/types/map";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { DEFAULT_CENTER } from "@/features/map/lib/constants";
import { buildCreatePatchWithMedia } from "@/features/properties/components/PropertyCreateModal/lib/buildCreatePatch";

type Props = {
  open: boolean;
  prefillAddress?: string;
  draftPin: LatLng | null;
  selectedPos?: LatLng | null;
  onClose: () => void;

  // 외부 상태 업데이트 콜백들 (최소화)
  appendItem: (item: PropertyItem) => void;
  selectAndOpenView: (id: string) => void;
  resetAfterCreate: () => void;
};

export default function MapCreateModalHost({
  open,
  prefillAddress,
  draftPin,
  selectedPos,
  onClose,
  appendItem,
  selectAndOpenView,
  resetAfterCreate,
}: Props) {
  return (
    <PropertyCreateModal
      open={open}
      key={prefillAddress ?? "blank"}
      initialAddress={prefillAddress}
      onClose={onClose}
      onSubmit={async (payload: CreatePayload) => {
        const id = `${Date.now()}`;
        const pos =
          draftPin ??
          selectedPos ??
          ({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng } as LatLng);

        const next = await buildCreatePatchWithMedia(payload, { id, pos });
        appendItem(next);
        selectAndOpenView(id);
        resetAfterCreate();
      }}
    />
  );
}
