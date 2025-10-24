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

// ✅ 결과 타입 (types.ts의 것과 동일하게)
type PropertyCreateResult = {
  pinId: string;
  matchedDraftId: number | null;
  lat: number;
  lng: number;
  payload?: any;
};

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
      // ✅ 자식이 넘겨준 결과만 사용. 여기서 createPin 다시 호출 금지!
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
          // 업로드/그룹등록도 인증 필요할 수 있으므로 체크
          const ok = await ensureAuthed();
          if (!ok) {
            toastBus?.error?.("로그인이 필요합니다. 먼저 로그인해 주세요.");
            submittingRef.current = false;
            return;
          }

          const serverId = pinId;
          const pos: LatLng =
            Number.isFinite(lat) && Number.isFinite(lng)
              ? { lat, lng }
              : resolvePos();

          // ✅ raw 미디어 배열 꺼내기 (프로젝트별 키 폴백)
          const _p = (payload ?? {}) as any;
          const fileItemsRaw =
            _p.fileItemsRaw ?? _p.fileItems ?? _p.verticalImages ?? [];
          const imageFoldersRaw =
            _p.imageFoldersRaw ??
            _p.imageFolders ??
            _p.imagesByCard ??
            _p.imageCards ??
            [];

          // 1) 그룹 구성
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

          // 2) 업로드 → 3) 그룹 등록
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

          // 4) 클라 상태 갱신
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
