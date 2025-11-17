"use client";

import { useRef } from "react";
import PropertyCreateModal from "@/features/properties/components/PropertyCreateModal/PropertyCreateModal";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { DEFAULT_CENTER } from "@/features/map/shared/constants";
import { buildCreatePatchWithMedia } from "@/features/properties/components/PropertyCreateModal/lib/buildCreatePatch";
import { LatLng } from "@/lib/geo/types";
import { toastBus } from "@/shared/toast/toastBus";
import { ensureAuthed } from "@/shared/api/auth";

import type { PropertyCreateResult } from "@/features/properties/components/PropertyCreateModal/types";

// ✅ 그룹(폴더) 생성: POST /photo-groups  (title, sortOrder, pinId:number)
import { createPhotoGroup } from "@/shared/api/photoGroups";

// ✅ 업로드(S3): POST /photo/upload  (요청당 10장 자동 분할)
import { uploadPhotosAndGetUrls } from "@/shared/api/photoUpload";

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
    /** 🔹 옵션: 생성때의 payload 스냅샷 전달 */
    payload?: any;
  }) => void;

  /** 임시핀 id (문자/숫자 둘 다 가능) */
  pinDraftId?: number | string | null;
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
  pinDraftId,
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

          // ---- 이미지 업로드 & 그룹(폴더) 생성 ----
          const _p = (payload ?? {}) as Record<string, unknown>;

          // 레거시/신규 키 폴백
          const fileItemsRaw: unknown[] =
            (_p["fileItemsRaw"] as unknown[]) ??
            (_p["fileItems"] as unknown[]) ??
            (_p["verticalImages"] as unknown[]) ??
            [];

          const imageFoldersRaw: unknown[][] =
            (_p["imageFoldersRaw"] as unknown[][]) ??
            (_p["imageFolders"] as unknown[][]) ??
            (_p["imageCards"] as unknown[][]) ?? // legacy 읽기 전용
            [];

          // 프론트 상태용 문자열 id
          const serverId = String(pinId);

          // 백엔드 전송용 숫자 id
          const pinIdNum = Number(pinId);
          if (!Number.isFinite(pinIdNum)) {
            throw new Error("유효하지 않은 pinId 입니다(숫자 아님).");
          }

          // 1) 세로 파일(대기열) 업로드 → URL만 확보
          const fileUrls =
            fileItemsRaw.length > 0
              ? await uploadPhotosAndGetUrls(
                  fileItemsRaw
                    .map((x: any) => x?.file as File)
                    .filter((f: File | undefined): f is File => !!f),
                  { domain: "map" }
                )
              : [];

          // 2) 각 가로 폴더별 업로드 (URL만 확보)
          const folderUrlsList: string[][] = [];
          for (const card of imageFoldersRaw) {
            const files = (card as unknown[])
              .map((i: any) => i?.file as File)
              .filter((f: File | undefined): f is File => !!f);
            const urls = files.length
              ? await uploadPhotosAndGetUrls(files, { domain: "map" })
              : [];
            folderUrlsList.push(urls);
          }

          // 3) 그룹(폴더) 레코드 생성 — 현재 백엔드는 URL을 받지 않으므로 제목/정렬만 보냄
          //    (추후 /photos 계열 API 나오면 반환된 group.id로 사진 URL을 연결)
          let sortBase = 0;

          if (fileUrls.length > 0) {
            await createPhotoGroup({
              pinId: pinIdNum, // ✅ number
              title: "files",
              sortOrder: sortBase++,
            });
          }

          for (let idx = 0; idx < folderUrlsList.length; idx++) {
            await createPhotoGroup({
              pinId: pinIdNum, // ✅ number
              title: `folder-${idx + 1}`,
              sortOrder: sortBase++,
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
            payload, // 🔹 전달
          });

          toastBus?.success?.(
            matchedDraftId != null
              ? "임시핀과 매칭되어 등록되었습니다."
              : "매물이 등록되고 이미지 그룹이 생성되었습니다."
          );
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
