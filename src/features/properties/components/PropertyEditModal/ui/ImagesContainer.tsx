"use client";

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
    onPickFilesToFolder, // (folderIdx, e)
    addPhotoFolder,
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,

    // ⬇️ 훅의 서버 상태/큐잉 API (제목/정렬/커버 연결용)
    groups,
    queueGroupTitle,
    reorder,
    makeCover,
  } = images;

  // objectURL 수명 관리
  const objectURLsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      objectURLsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectURLsRef.current = [];
    };
  }, []);

  /** 1) 카드 이미지: EditImagesAPI.imageFolders -> PhotoFolder[] */
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
        return {
          id: `folder-${idx}`,
          title: `사진 폴더 ${idx + 1}`,
          items,
        };
      }),
    [imageFolders]
  );

  /** 2) 세로형(업로드 대기) 파일들: ImageItem[] -> ResolvedFileItem[] */
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

  /** 3) 새 시그니처 어댑터: (idx, FileList|null) -> 기존 onPickFilesToFolder 호출 */
  const addToFolder = (folderIdx: number, files: FileList | null) => {
    const evt = {
      target: { files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    return onPickFilesToFolder(folderIdx, evt);
  };

  /** 4) 폴더 인덱스 ↔ 서버 그룹(가로 카드 전용) 매핑 */
  const horizGroups = useMemo<PinPhotoGroup[]>(() => {
    const list = (groups ?? []) as PinPhotoGroup[];
    return list
      .filter(
        (g) => !(typeof g.title === "string" && g.title.startsWith("__V__"))
      )
      .slice()
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          String(a.title ?? "").localeCompare(String(b.title ?? ""))
      );
  }, [groups]);

  // 폴더 제목 수정 → 그룹 제목 큐잉
  const onChangeFolderTitle = (folderIdx: number, title: string) => {
    const g = horizGroups[folderIdx];
    if (!g) return;
    const normalized = title?.trim() || null; // 빈 문자열이면 null 처리
    queueGroupTitle(g.id, normalized);
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
      /* 폴더(가로형 카드) */
      folders={folders}
      onChangeFolderTitle={onChangeFolderTitle}
      onOpenPicker={openImagePicker}
      onAddToFolder={addToFolder} // ✅ FileList만 올리는 새 시그니처
      registerInputRef={registerImageInput}
      onAddFolder={addPhotoFolder}
      onRemoveFolder={removePhotoFolder}
      maxPerCard={MAX_PER_CARD}
      onChangeCaption={onChangeImageCaption}
      onRemoveImage={handleRemoveImage}
      onReorder={onReorder}
      onSetCover={onSetCover}
      /* 세로형(파일 대기열) */
      fileItems={fileItems}
      onAddFiles={onAddFiles}
      onChangeFileItemCaption={onChangeFileItemCaption}
      onRemoveFileItem={handleRemoveFileItem}
      maxFiles={MAX_FILES}
    />
  );
}
