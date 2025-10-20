// src/features/map/components/MapCreateModalHost.tsx
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
import { ensureAuthed } from "@/shared/api/auth";

// 업로드 & URL 변환
import { uploadPhotos, metaToUrl } from "@/shared/api/photos";
// 새 스펙: 그룹 등록
import { createGroupPhotos } from "@/shared/api/pinPhotos";

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
          const ok = await ensureAuthed();
          if (!ok) {
            toastBus?.error?.("로그인이 필요합니다. 먼저 로그인해 주세요.");
            submittingRef.current = false;
            return;
          }

          const pos = resolvePos();
          const safeDto = buildCreateDto(payload, pos, prefillAddress);

          // 1) 매물 생성
          const { id: serverId, matchedDraftId } = await createPin(safeDto);

          // ✅ 타입캐스팅 + 키 폴백(프로젝트에 따라 imageFolders/imagesByCard, fileItems/verticalImages 등)
          const _p = payload as any;
          const fileItemsRaw =
            _p.fileItemsRaw ?? _p.fileItems ?? _p.verticalImages ?? [];
          const imageFoldersRaw =
            _p.imageFoldersRaw ??
            _p.imageFolders ??
            _p.imagesByCard ??
            _p.imageCards ??
            [];

          // 디버그: 파일이 실제로 들어오는지 확인
          console.log(
            "files?",
            fileItemsRaw.map((x: any) => !!x?.file),
            (imageFoldersRaw as any[]).flatMap((c: any[]) =>
              c.map((i: any) => !!i?.file)
            )
          );

          // 2) 그룹 구성
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

          // 디버그
          console.debug("[Create] files debug", {
            fileItemsLen: (fileItemsRaw as any[]).length,
            imageFoldersLen: (imageFoldersRaw as any[]).length,
            fileItemsHasFile: (fileItemsRaw as any[]).map(
              (x: any) => !!x?.file
            ),
            folderHasFile: (imageFoldersRaw as any[]).flatMap((c: any[]) =>
              c.map((i: any) => !!i?.file)
            ),
            groupsCount: groups.length,
          });

          // 3) 업로드 → 4) 그룹 등록
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

          // 5) 클라 상태 갱신
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
            const msg = pickErrorMessage(e) || "매물 등록에 실패했습니다.";
            toastBus?.error?.(msg);
          }
        } finally {
          submittingRef.current = false;
        }
      }}
    />
  );
}
