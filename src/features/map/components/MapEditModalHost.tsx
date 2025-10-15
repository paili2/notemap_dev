"use client";

import { useRef, useCallback, useEffect } from "react";

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
  /** 부모(useMapHomeState)에서 직접 저장 로직을 처리하고 싶을 때 넘김 */
  onSubmit?: (payload: unknown) => Promise<void>;
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSubmit = useCallback(
    async (payload: unknown) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      try {
        if (onSubmit) {
          // 부모에서 저장을 처리하는 모드
          await onSubmit(payload);
          if (mountedRef.current) onClose();
          return;
        }

        // 로컬 fallback 저장 플로우
        const patch = await buildEditPatchWithMedia(payload as any, selectedId);
        updateItems((prev) =>
          prev.map((p) =>
            p.id === selectedId ? applyPatchToItem(p, patch) : p
          )
        );
        if (mountedRef.current) onClose();
      } catch (e) {
        console.error("Edit failed:", e);
      } finally {
        submittingRef.current = false;
      }
    },
    [onSubmit, selectedId, updateItems, onClose]
  );

  // 모달은 열릴 때만 렌더하고 싶다면 이 가드로 비용 절약 가능(선호에 따라 유지/삭제)
  // if (!open) return null;

  return (
    <PropertyEditModal
      key={selectedId} // 편집 대상 바뀌면 폼 초기화
      open={open}
      initialData={data}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
}
