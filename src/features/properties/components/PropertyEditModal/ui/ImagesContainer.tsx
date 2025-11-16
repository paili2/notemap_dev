"use client";

import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import { MAX_FILES, MAX_PER_CARD } from "../../constants";
import ImagesSection, {
  type PhotoFolder,
} from "../../sections/ImagesSection/ImagesSection";
import type { EditImagesAPI } from "../hooks/useEditImages";
import type {
  ImageItem,
  ResolvedFileItem,
} from "@/features/properties/types/media";
import type { PinPhotoGroup } from "@/shared/api/types/pinPhotos";

/** 세로 그룹 식별 프리픽스(서버 title에 항상 포함) */
const VERT_PREFIX = "__V__";

export default function ImagesContainer({ images }: { images: EditImagesAPI }) {
  const {
    imageFolders,
    verticalImages,
    registerImageInput,
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,

    // ⬇️ 훅의 서버 상태/큐잉 API
    groups,
    queueGroupTitle,
    reorder,
    makeCover,
  } = images;

  const objectURLsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      objectURLsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      objectURLsRef.current = [];
    };
  }, []);

  /** 0) 가로 그룹 목록 (세로 그룹 제외) */
  const horizGroups = useMemo<PinPhotoGroup[]>(() => {
    const list = (groups ?? []) as PinPhotoGroup[];
    return list
      .filter(
        (g) => !(typeof g.title === "string" && g.title.startsWith(VERT_PREFIX))
      )
      .slice()
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          String(a.title ?? "").localeCompare(String(b.title ?? ""))
      );
  }, [groups]);

  /** 1) 세로 그룹 (title이 "__V__" 로 시작하는 그룹 하나 가정) */
  const verticalGroup = useMemo<PinPhotoGroup | null>(() => {
    const list = (groups ?? []) as PinPhotoGroup[];
    return (
      list.find(
        (g) => typeof g.title === "string" && g.title.startsWith(VERT_PREFIX)
      ) ?? null
    );
  }, [groups]);

  /** 2) UI에 표시할 세로 폴더 제목 ("__V__" 프리픽스 제거) */
  const verticalFolderTitle = useMemo(() => {
    if (!verticalGroup?.title) return "";
    const raw = String(verticalGroup.title);
    return raw.replace(/^__V__\s*/i, "");
  }, [verticalGroup]);

  /** 세로 그룹용 raw title 생성: "__V__ 사용자입력" 형태 유지 */
  const buildVerticalRawTitle = (title: string | null | undefined): string => {
    const safe = (title ?? "").trim();
    if (!safe) {
      // 비어 있으면 기본값
      return `${VERT_PREFIX} files`;
    }
    // 혹시 사용자가 "__V__"를 직접 쳤다가 또 바꾸는 경우 방어
    const withoutPrefix = safe.replace(/^__V__\s*/i, "");
    return `${VERT_PREFIX} ${withoutPrefix}`;
  };

  /** 3) 가로 카드용 folders (서버 그룹 title 반영) */
  const folders: PhotoFolder[] = useMemo(
    () =>
      imageFolders.map((folder, idx) => {
        const items: ImageItem[] = folder.map((it) => {
          const base: ImageItem = {
            url: it.url ?? it.dataUrl ?? "",
            name: it.name ?? it.file?.name ?? "",
            caption: it.caption ?? "",
          };
          if ((it as any).id != null) {
            (base as any).id = (it as any).id;
          }
          return base;
        });

        const g = horizGroups[idx] as any | undefined;
        const rawTitle =
          typeof g?.title === "string" ? (g.title as string) : "";

        return {
          id: g?.id != null ? String(g.id) : `folder-${idx}`,
          // 입력칸 기본값: 서버에서 내려준 제목, 없으면 빈 문자열
          title: rawTitle,
          items,
        };
      }),
    [imageFolders, horizGroups]
  );

  /** 4) 세로형(업로드 대기) 파일들 */
  const fileItems: ResolvedFileItem[] = useMemo(
    () =>
      verticalImages.flatMap((it) => {
        const url =
          it.url ??
          it.dataUrl ??
          (it.file ? URL.createObjectURL(it.file) : undefined);
        if (!url) return [];

        if (!it.url && !it.dataUrl && it.file) {
          objectURLsRef.current.push(url);
        }

        const base: ResolvedFileItem = {
          name: it.name ?? it.file?.name ?? "",
          url,
          caption: it.caption ?? "",
          idbKey: it.idbKey,
        };
        if ((it as any).id != null) {
          (base as any).id = (it as any).id;
        }
        return [base];
      }),
    [verticalImages]
  );

  /** 5) 새 시그니처 어댑터: (idx, FileList|null) -> 기존 onPickFilesToFolder 호출 */
  const addToFolder = (folderIdx: number, files: FileList | null) => {
    const evt = {
      target: { files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    return onPickFilesToFolder(folderIdx, evt);
  };

  // 가로 폴더 제목 수정 → 해당 그룹 title 큐잉
  const onChangeFolderTitle = (folderIdx: number, title: string) => {
    const g = horizGroups[folderIdx];
    if (!g) return;
    const normalized = title?.trim() || null;
    queueGroupTitle(g.id, normalized);
  };

  // 🔥 세로 폴더 제목/캡션 수정 → verticalGroup title 큐잉 + 기존 캡션 로직 유지
  const handleChangeVerticalCaption = (index: number, text: string) => {
    // 원래 훅에 있던 캡션 갱신
    onChangeFileItemCaption(index, text);
    // 폴더 제목은 index 0 기준으로만 그룹 title 패치
    if (index !== 0 || !verticalGroup) return;
    const rawTitle = buildVerticalRawTitle(text);
    queueGroupTitle(verticalGroup.id, rawTitle);
  };

  // 정렬/커버 → 훅 큐잉
  const onReorder = (photoId: number | string | undefined, to: number) => {
    if (photoId == null) return;
    reorder(String(photoId), to);
  };
  const onSetCover = (photoId: number | string | undefined) => {
    if (photoId == null) return;
    makeCover(String(photoId));
  };

  return (
    <ImagesSection
      /* 가로 폴더 */
      folders={folders}
      onChangeFolderTitle={onChangeFolderTitle}
      onOpenPicker={openImagePicker}
      onAddToFolder={addToFolder}
      registerInputRef={registerImageInput}
      onAddFolder={addPhotoFolder}
      onRemoveFolder={removePhotoFolder}
      maxPerCard={MAX_PER_CARD}
      onChangeCaption={onChangeImageCaption}
      onRemoveImage={handleRemoveImage}
      onReorder={onReorder}
      onSetCover={onSetCover}
      /* 세로 (파일 대기열) */
      fileItems={fileItems}
      onAddFiles={onAddFiles}
      onChangeFileItemCaption={handleChangeVerticalCaption}
      onRemoveFileItem={handleRemoveFileItem}
      maxFiles={MAX_FILES}
      verticalFolderTitle={verticalFolderTitle}
    />
  );
}
