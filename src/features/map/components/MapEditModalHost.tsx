"use client";

import PropertyEditModal from "@/features/properties/components/PropertyEditModal/PropertyEditModal";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { buildEditPatchWithMedia } from "@/features/properties/components/PropertyEditModal/lib/buildEditPatch";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { applyPatchToItem } from "@/features/properties/lib/view/applyPatchToItem";
import { useRef } from "react";

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
  const submittingRef = useRef(false);

  return (
    <PropertyEditModal
      key={selectedId} // 편집 대상 변경 시 폼 초기화
      open={open}
      initialData={data}
      onClose={onClose}
      onSubmit={async (payload /* : EditPayload */) => {
        if (submittingRef.current) return;
        submittingRef.current = true;

        try {
          const patch = await buildEditPatchWithMedia(payload, selectedId);
          updateItems((prev) =>
            prev.map((p) =>
              p.id === selectedId ? applyPatchToItem(p, patch) : p
            )
          );
          onClose(); // 기존 UX 유지: 저장 후 닫기
        } catch (e) {
          console.error("Edit failed:", e);
          // TODO: 토스트/알림 훅이 있다면 연결
        } finally {
          submittingRef.current = false;
        }
      }}
    />
  );
}
