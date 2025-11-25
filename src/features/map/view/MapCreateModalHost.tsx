"use client";

import { useRef } from "react";
import PropertyCreateModal from "@/features/properties/components/PropertyCreateModal/PropertyCreateModal";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { DEFAULT_CENTER } from "@/features/map/shared/constants";
import { buildCreatePatchWithMedia } from "@/features/properties/components/PropertyCreateModal/lib/buildCreatePatch";
import type { LatLng } from "@/lib/geo/types";
import { toastBus } from "@/shared/toast/toastBus";
import { ensureAuthed } from "@/shared/api/auth";

import type { PropertyCreateResult } from "@/features/properties/components/PropertyCreateModal/types";
import { PinKind } from "@/features/pins/types";

type MapCreateModalHostProps = {
  open: boolean;
  prefillAddress?: string;
  draftPin: LatLng | null;
  selectedPos?: LatLng | null;
  onClose: () => void;
  appendItem: (item: PropertyItem) => void;
  resetAfterCreate: () => void;
  onAfterCreate?: (args: {
    pinId: string;
    matchedDraftId?: string | number | null;
    lat: number;
    lng: number;
    /** 🔹 옵션: 생성때의 payload 스냅샷 전달 */
    payload?: any;
  }) => void;

  /** 임시핀 id (문자/숫자 둘 다 가능) */
  pinDraftId?: number | string | null;
  createPinKind?: PinKind | null;
};

export default function MapCreateModalHost({
  open,
  prefillAddress,
  draftPin,
  selectedPos,
  onClose,
  appendItem,
  resetAfterCreate,
  onAfterCreate,
  pinDraftId,
  createPinKind,
}: MapCreateModalHostProps) {
  const submittingRef = useRef(false);

  const resolvePos = (): LatLng => draftPin ?? selectedPos ?? DEFAULT_CENTER;

  // ✅ PropertyCreateModal 쪽에 넘겨줄 "정제된" draftId (number | undefined)
  const resolvedPinDraftId = (() => {
    if (pinDraftId == null || pinDraftId === "") return undefined;
    const n = Number(pinDraftId);
    return Number.isFinite(n) ? n : undefined;
  })();

  return (
    <PropertyCreateModal
      open={open}
      key={prefillAddress ?? "blank"}
      initialAddress={prefillAddress}
      onClose={onClose}
      /** ✅ 기존 핀 좌표 그대로 사용 */
      initialLat={resolvePos().lat}
      initialLng={resolvePos().lng}
      /** ✅ 임시핀 아이디 전달 (없으면 undefined) */
      pinDraftId={resolvedPinDraftId}
      initialPinKind={createPinKind ?? null}
      onSubmit={async ({
        pinId,
        matchedDraftId,
        payload,
        lat,
        lng,
      }: PropertyCreateResult) => {
        if (submittingRef.current) return;
        submittingRef.current = true;

        try {
          const ok = await ensureAuthed();
          if (!ok) {
            toastBus?.error?.("로그인이 필요합니다. 먼저 로그인해 주세요.");
            submittingRef.current = false;
            return;
          }

          const pos: LatLng =
            Number.isFinite(lat) && Number.isFinite(lng)
              ? { lat, lng }
              : resolvePos();

          const serverId = String(pinId);

          // 🔹 Body 에서 만들어준 payload 기준으로 리스트용 패치 생성
          const next = await buildCreatePatchWithMedia(payload, {
            id: serverId,
            pos,
          });

          // ✅ 리스트에 추가만 하고, 뷰모달 열기는 상위(onAfterCreate)에서 처리
          appendItem(next);
          resetAfterCreate();

          // ✅ MapHomeUI 쪽에서 방금 생성한 매물 상세를 열도록 위임
          onAfterCreate?.({
            pinId: serverId,
            matchedDraftId,
            lat: pos.lat,
            lng: pos.lng,
            payload,
          });

          toastBus?.success?.(
            matchedDraftId != null
              ? "임시핀과 매칭되어 등록되었습니다."
              : "매물이 등록되었습니다."
          );

          // ✅ 현재 구조에서는 여기서 생성 모달을 닫는다.
          //    나중에 “단일 모달 호스트(stage: create/view/edit)”로 리팩터링하면
          //    이 닫기 역할도 상위 호스트에서 stage 전환으로 대체할 예정.
          onClose?.();
        } catch (e: any) {
          const res = e?.response?.data;
          const messages: string[] | undefined = Array.isArray(res?.messages)
            ? (res.messages as string[])
            : undefined;

          if (messages?.length) {
            console.log("messages:", messages);
            toastBus?.error?.(messages.join("\n"));
          } else {
            const msg: string = e?.message || "매물 등록에 실패했습니다.";
            toastBus?.error?.(msg);
          }
        } finally {
          submittingRef.current = false;
        }
      }}
    />
  );
}
