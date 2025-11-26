"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";
import PropertyEditModal from "@/features/properties/components/PropertyEditModal/PropertyEditModal";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import { buildEditPatchWithMedia } from "@/features/properties/components/PropertyEditModal/lib/buildEditPatch";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { applyPatchToItem } from "@/features/properties/lib/view/applyPatchToItem";

type MapEditModalHostProps = {
  open: boolean;
  /** 뷰모달에서 온 프리필(부분 데이터일 수 있음) */
  data: Partial<PropertyViewDetails> & {
    // editInitial이 붙어 올 수도 있어서 넉넉하게 허용
    editInitial?: any;
  };
  selectedId: string;
  onClose: () => void;
  updateItems: (updater: (prev: PropertyItem[]) => PropertyItem[]) => void;
  onSubmit?: (payload: unknown) => Promise<void>;
};

/** 🔧 Partial<PropertyViewDetails> → PropertyViewDetails 로 승격
 *  - 현재 스키마에서 필수는 listingStars뿐이라 기본값 0만 채워주면 충분
 */
function toEditInitialView(
  d: Partial<PropertyViewDetails>
): PropertyViewDetails {
  return {
    ...d,
    listingStars: d.listingStars ?? 0,
  } as PropertyViewDetails;
}

export default function MapEditModalHost({
  open,
  data,
  selectedId,
  onClose,
  updateItems,
  onSubmit,
}: MapEditModalHostProps) {
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
          await onSubmit(payload);
          if (mountedRef.current) onClose();
          return;
        }
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

  if (!open) return null;

  // 🔥 useEditForm이 기대하는 initialData 래퍼 구성
  const initialForForm = useMemo(() => {
    const anyData = data as any;

    // 1) MapHomeUI / ViewModal 쪽에서 이미 editInitial = { view, raw } 를 붙여줬다면 → 그대로 사용
    if (anyData.editInitial) {
      return anyData.editInitial;
    }

    // 2) 아니면 최소한 view 래퍼로 감싸서 넘겨줌
    //    useEditForm 안에서 wrapper.view를 보고 normalizeInitialData() 실행
    const view = toEditInitialView(data);
    return { view };
  }, [data]);

  return (
    <PropertyEditModal
      key={selectedId}
      open={open}
      initialData={initialForForm}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
}
