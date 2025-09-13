"use client";

import PropertyCreateModal from "@/features/properties/components/PropertyCreateModal/PropertyCreateModal";
import type { CreatePayload } from "@/features/properties/types/property-dto";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { DEFAULT_CENTER } from "@/features/map/lib/constants";
import { buildCreatePatchWithMedia } from "@/features/properties/components/PropertyCreateModal/lib/buildCreatePatch";
import { LatLng } from "@/lib/geo/types";
import { useRef } from "react";

type MapCreateModalHostProps = {
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
}: MapCreateModalHostProps) {
  // 중복 제출 가드
  const submittingRef = useRef(false);

  const resolveId = () => {
    try {
      // 브라우저/노드 최신 환경이면 이게 가장 안전
      return crypto.randomUUID();
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
  };

  const resolvePos = (): LatLng => {
    return draftPin ?? selectedPos ?? DEFAULT_CENTER;
  };

  return (
    <PropertyCreateModal
      open={open}
      key={prefillAddress ?? "blank"}
      initialAddress={prefillAddress}
      onClose={onClose}
      onSubmit={async (payload: CreatePayload) => {
        if (submittingRef.current) return;
        submittingRef.current = true;

        try {
          const id = resolveId();
          const pos = resolvePos();

          const next = await buildCreatePatchWithMedia(payload, { id, pos });
          appendItem(next);
          selectAndOpenView(id);
          resetAfterCreate();
          // 성공 후 닫고 싶다면 여기에 onClose() 추가 가능 (지금 흐름 유지면 생략)
        } catch (e) {
          console.error("Create failed:", e);
          // TODO: toast/error UI가 있다면 연결
        } finally {
          submittingRef.current = false;
        }
      }}
    />
  );
}
