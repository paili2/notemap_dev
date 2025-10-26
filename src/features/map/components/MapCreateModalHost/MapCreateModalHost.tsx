"use client";

import { useRef } from "react";
import PropertyCreateModal from "@/features/properties/components/PropertyCreateModal/PropertyCreateModal";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { DEFAULT_CENTER } from "@/features/map/lib/constants";
import { buildCreatePatchWithMedia } from "@/features/properties/components/PropertyCreateModal/lib/buildCreatePatch";
import { LatLng } from "@/lib/geo/types";
import { toastBus } from "@/shared/toast/toastBus";
import { ensureAuthed } from "@/shared/api/auth";

// 업로드 & URL 변환
import { uploadPhotos, metaToUrl } from "@/shared/api/photos";
// 새 스펙: 그룹 등록
import { createGroupPhotos } from "@/shared/api/pinPhotos";
import type { PropertyCreateResult } from "@/features/properties/components/PropertyCreateModal/types";

type MapCreateModalHostProps = {
  open: boolean;
  prefillAddress?: string;
  draftPin: LatLng | null;
  selectedPos?: LatLng | null;
  onClose: () => void;
  appendItem: (item: PropertyItem) => void;
  selectAndOpenView: (id: string) => void;
  resetAfterCreate: () => void;
  onAfterCreate?: (args: {
    pinId: string;
    matchedDraftId?: string | number | null;
    lat: number;
    lng: number;
  }) => void;
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
  onAfterCreate,
}: MapCreateModalHostProps) {
  const submittingRef = useRef(false);
  const resolvePos = (): LatLng => draftPin ?? selectedPos ?? DEFAULT_CENTER;

  return (
    <PropertyCreateModal
      open={open}
      key={prefillAddress ?? "blank"}
      initialAddress={prefillAddress}
      onClose={onClose}
      /** ✅ 기존 핀 좌표를 그대로 주입 (지오코딩/드래그 좌표 금지) */
      initialLat={resolvePos().lat}
      initialLng={resolvePos().lng}
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

          // ✅ 결과 좌표 그대로 사용 (백업: resolvePos)
          const pos: LatLng =
            Number.isFinite(lat) && Number.isFinite(lng)
              ? { lat, lng }
              : resolvePos();

          // ---- 이미지 업로드 & 그룹 등록 ----
          const _p = (payload ?? {}) as any;

          // NOTE: 프로젝트별 키 폴백
          const fileItemsRaw =
            _p.fileItemsRaw ?? _p.fileItems ?? _p.verticalImages ?? [];
          const imageFoldersRaw =
            _p.imageFoldersRaw ??
            _p.imageFolders ??
            _p.imageCards ?? // ← imagesByCard는 선호하지 않아 폴백에만 둠
            [];

          const serverId = String(pinId);

          const fileGroup = {
            groupId: `${serverId}:files`,
            files: (fileItemsRaw as any[])
              .map((x: any) => x?.file as File)
              .filter(Boolean) as File[],
          };

          const folderGroups = (imageFoldersRaw as any[][]).map(
            (card, idx) => ({
              groupId: `${serverId}:folder:${idx}`,
              files: card
                .map((i: any) => i?.file as File)
                .filter(Boolean) as File[],
            })
          );

          const groups = [fileGroup, ...folderGroups].filter(
            (g) => (g.files?.length ?? 0) > 0
          );

          for (let gi = 0; gi < groups.length; gi++) {
            const g = groups[gi];
            const metas = await uploadPhotos(g.files, { domain: "map" });
            const urls = metas.map(metaToUrl);
            await createGroupPhotos(g.groupId, {
              urls,
              sortOrders: urls.map((_, i) => i),
              isCover: gi === 0 ? true : undefined,
            });
          }

          // ---- 클라 상태 반영 ----
          const next = await buildCreatePatchWithMedia(payload, {
            id: serverId,
            pos,
          });
          appendItem(next);
          selectAndOpenView(serverId);
          resetAfterCreate();

          onAfterCreate?.({
            pinId: serverId,
            matchedDraftId,
            lat: pos.lat,
            lng: pos.lng,
          });

          toastBus?.success?.(
            matchedDraftId != null
              ? "임시핀과 매칭되어 등록되었습니다."
              : "매물이 등록되고 이미지가 연결되었습니다."
          );
          onClose?.();
        } catch (e: any) {
          const res = e?.response?.data;
          const messages = Array.isArray(res?.messages)
            ? res.messages
            : undefined;
          if (messages?.length) {
            console.log("messages:", messages);
            toastBus?.error?.(messages.join("\n"));
          } else {
            const msg = e?.message || "매물 등록에 실패했습니다.";
            toastBus?.error?.(msg);
          }
        } finally {
          submittingRef.current = false;
        }
      }}
    />
  );
}
