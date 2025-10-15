"use client";

import { useRef } from "react";
import PropertyCreateModal from "@/features/properties/components/PropertyCreateModal/PropertyCreateModal";
import type { CreatePayload } from "@/features/properties/types/property-dto";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { DEFAULT_CENTER } from "@/features/map/lib/constants";
import { buildCreatePatchWithMedia } from "@/features/properties/components/PropertyCreateModal/lib/buildCreatePatch";
import { LatLng } from "@/lib/geo/types";
import { createPin } from "@/shared/api/pins";
import { toastBus } from "@/shared/toast/toastBus";
import { buildCreateDto } from "./buildCreateDto";
import { pickErrorMessage } from "./dtoUtils";

type MapCreateModalHostProps = {
  open: boolean;
  prefillAddress?: string;
  draftPin: LatLng | null;
  selectedPos?: LatLng | null;
  onClose: () => void;
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
  const submittingRef = useRef(false);
  const resolvePos = (): LatLng => draftPin ?? selectedPos ?? DEFAULT_CENTER;

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
          const pos = resolvePos();
          const safeDto = buildCreateDto(payload, pos, prefillAddress);

          // ✅ 서버 저장
          const { id: serverId, matchedDraftId } = await createPin(safeDto);

          // 클라 반영
          const next = await buildCreatePatchWithMedia(payload, {
            id: String(serverId),
            pos,
          });
          appendItem(next);
          selectAndOpenView(String(serverId));
          resetAfterCreate();

          toastBus?.success?.(
            typeof matchedDraftId === "number"
              ? "임시핀과 매칭되어 등록되었습니다."
              : "매물이 등록되었습니다."
          );
          onClose?.();
        } catch (e: any) {
          console.error("Create (POST /pins) failed:", e?.response ?? e);
          const msg = pickErrorMessage(e) || "매물 등록에 실패했습니다.";
          toastBus?.error?.(msg);
        } finally {
          submittingRef.current = false;
        }
      }}
    />
  );
}
