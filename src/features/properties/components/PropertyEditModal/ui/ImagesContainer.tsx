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
      .filter((g) => g.isDocument !== true)
      .slice()
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          String(a.title ?? "").localeCompare(String(b.title ?? ""))
      );
  }, [groups]);

  /** 1) 세로 그룹 (isDocument === true 인 그룹 하나 가정) */
  const verticalGroup = useMemo<PinPhotoGroup | null>(() => {
    const list = (groups ?? []) as PinPhotoGroup[];
    return list.find((g) => g.isDocument === true) ?? null;
  }, [groups]);

  /** 2) UI에 표시할 세로 폴더 제목 (title 그대로) */
  const verticalFolderTitle = useMemo(() => {
    if (!verticalGroup?.title) return "";
    return String(verticalGroup.title);
  }, [verticalGroup]);

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

  /** 5) (idx, FileList|null) → 훅 onPickFilesToFolder (그냥 FileList 전달) */
  const addToFolder = (folderIdx: number, files: FileList | null) => {
    onPickFilesToFolder(folderIdx, files);
  };

  // 가로 폴더 제목 수정 → 해당 그룹 title 큐잉
  const onChangeFolderTitle = (folderIdx: number, title: string) => {
    const g = horizGroups[folderIdx];
    if (!g) return;
    const normalized = title?.trim() || null;
    queueGroupTitle(g.id, normalized);
  };

  // 세로 폴더 제목 수정
  const onChangeVerticalFolderTitle = (title: string) => {
    if (!verticalGroup) return;
    const normalized = title.trim() || null;
    queueGroupTitle(verticalGroup.id, normalized);
  };

  // 세로 파일 캡션
  const handleChangeVerticalCaption = (index: number, text: string) => {
    onChangeFileItemCaption(index, text);
  };

  // 정렬/커버
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
      onChangeVerticalFolderTitle={onChangeVerticalFolderTitle}
    />
  );
}
