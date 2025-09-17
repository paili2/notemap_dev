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
  /** 부모(useMapHomeState)에서 직접 저장 로직을 처리하고 싶을 때 넘김 */
  onSubmit?: (payload: any) => Promise<void>;
};

export default function MapEditModalHost({
  open,
  data,
  selectedId,
  onClose,
  updateItems,
  onSubmit,
}: Props) {
  const submittingRef = useRef(false);

  const handleSubmit = async (payload: any) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      // 부모가 onSubmit을 전달했다면(= useMapHomeState에서 처리) 그걸 호출
      if (onSubmit) {
        await onSubmit(payload);
        onClose();
        return;
      }

      // 아니면 로컬에서 패치 + 병합(기존 Fallback 로직)
      const patch = await buildEditPatchWithMedia(payload, selectedId);
      updateItems((prev) =>
        prev.map((p) => (p.id === selectedId ? applyPatchToItem(p, patch) : p))
      );
      onClose();
    } catch (e) {
      console.error("Edit failed:", e);
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <PropertyEditModal
      key={selectedId} // 편집 대상 바뀌면 폼 초기화
      open={open}
      initialData={data}
      onClose={onClose}
      onSubmit={handleSubmit} // ✅ 여기!
    />
  );
}
