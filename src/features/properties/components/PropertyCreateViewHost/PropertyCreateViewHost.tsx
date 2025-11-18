"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

import PropertyCreateModalBody from "@/features/properties/components/PropertyCreateModal/PropertyCreateModalBody";
import PropertyViewModal from "@/features/properties/components/PropertyViewModal/PropertyViewModal";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { LatLng } from "@/lib/geo/types";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import type { PropertyCreateResult } from "@/features/properties/components/PropertyCreateModal/types";

type Stage = "create" | "view";

type Props = {
  open: boolean;

  /** 최초엔 create로 시작, 필요하면 view로 시작하는 케이스도 만들 수 있음 */
  initialStage?: Stage;

  // 공통
  onClose: () => void;

  // 생성 쪽
  initialAddress?: string;
  initialPos: LatLng;
  pinDraftId?: number | string | null;
  appendItem: (item: PropertyItem) => void;
  resetAfterCreate: () => void;
  /** 리스트/MapHomeUI와 동기화용 (지금 onAfterCreate 그대로 넘기면 됨) */
  onAfterCreate?: (args: {
    pinId: string;
    matchedDraftId?: string | number | null;
    lat: number;
    lng: number;
    payload?: any;
  }) => void;

  // 뷰 쪽
  initialViewData?: PropertyViewDetails | null;
  onSaveViewPatch?: (p: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDeleteFromView?: () => void | Promise<void>;
};

export default function PropertyCreateViewHost({
  open,
  initialStage = "create",
  onClose,
  initialAddress,
  initialPos,
  pinDraftId,
  appendItem,
  resetAfterCreate,
  onAfterCreate,
  initialViewData,
  onSaveViewPatch,
  onDeleteFromView,
}: Props) {
  const [stage, setStage] = useState<Stage>(initialStage);
  const [createdPinId, setCreatedPinId] = useState<string | number | null>(
    initialViewData?.id ?? null
  );

  // 🔹 PropertyCreateModalBody 에 넘길 때 null → undefined 로 정리
  const resolvedPinDraftId: string | number | undefined =
    pinDraftId == null ? undefined : pinDraftId;

  // 생성 쪽 onSubmit: 성공하면 stage를 view로 전환
  const handleCreateSubmit = useCallback(
    async ({
      pinId,
      matchedDraftId,
      payload,
      lat,
      lng,
    }: PropertyCreateResult) => {
      // 상위(MapHomeUI) 동기화 로직
      onAfterCreate?.({
        pinId: String(pinId),
        matchedDraftId,
        lat,
        lng,
        payload,
      });

      // 생성 직후 뷰로 전환
      setCreatedPinId(pinId);
      setStage("view");
    },
    [onAfterCreate]
  );

  if (!open) return null;

  // ✅ 예전 Create/Edit 모달과 동일한 프레임 구조로 복구
  //    - 전체 화면(fixed inset-0)
  //    - 카드: flex-col + overflow-hidden
  //    - sm에선 전체 h-screen, md 이상에서 max-h-[92vh]
  const frame = (inner: React.ReactNode) => (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="닫기"
        title="닫기"
      />
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "bg-white shadow-xl overflow-hidden flex flex-col",
          "w-screen h-screen max-w-none max-h-none rounded-none",
          "md:w-[1100px] md:max-w-[95vw] md:max-h-[92vh] md:rounded-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {inner}
      </div>
    </div>
  );

  let content: React.ReactNode;

  if (stage === "create") {
    content = (
      <PropertyCreateModalBody
        asInner
        onClose={onClose}
        onSubmit={handleCreateSubmit}
        initialAddress={initialAddress}
        initialLat={initialPos.lat}
        initialLng={initialPos.lng}
        pinDraftId={resolvedPinDraftId}
      />
    );
  } else {
    content = (
      <PropertyViewModal
        asInner
        open={true}
        onClose={onClose}
        pinId={createdPinId ?? undefined}
        data={initialViewData ?? undefined}
        onSave={onSaveViewPatch}
        onDelete={onDeleteFromView}
      />
    );
  }

  return typeof document !== "undefined"
    ? createPortal(frame(content), document.body)
    : frame(content);
}
