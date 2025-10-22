"use client";

import { useEffect, useRef } from "react";
import { MAX_FILES, MAX_PER_CARD } from "../../constants";
import ImagesSection from "../../sections/ImagesSection/ImagesSection";
import type { EditImagesAPI } from "../hooks/useEditImages";
import type {
  ImageItem,
  ResolvedFileItem,
} from "@/features/properties/types/media";

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
  } = images;

  // objectURL 수명 관리
  const objectURLsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      objectURLsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectURLsRef.current = [];
    };
  }, []);

  // 1) 카드 이미지: EditImagesAPI.imageFolders -> ImageItem[][]
  const imagesByCard: ImageItem[][] = imageFolders.map((folder) =>
    folder.map((it) => {
      const base: ImageItem = {
        url: it.url ?? it.dataUrl ?? "", // 최소 url 보장(없으면 "")
        name: it.name ?? it.file?.name ?? "",
        caption: it.caption ?? "",
      };
      // 서버 id가 있다면 보존(삭제/대표지정 등에서 활용)
      if ((it as any).id != null) {
        (base as any).id = (it as any).id;
      }
      return base;
    })
  );

  // 2) 세로형(업로드 대기) 파일들: ImageItem[] -> ResolvedFileItem[]
  const fileItems: ResolvedFileItem[] = verticalImages.flatMap((it) => {
    const url =
      it.url ??
      it.dataUrl ??
      (it.file ? URL.createObjectURL(it.file) : undefined);
    if (!url) return [];

    // 새 objectURL은 정리용으로 기록
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
  });

  return (
    <ImagesSection
      imagesByCard={imagesByCard}
      onOpenPicker={openImagePicker}
      onChangeFiles={onPickFilesToFolder}
      registerInputRef={registerImageInput}
      onAddPhotoFolder={addPhotoFolder}
      onRemovePhotoFolder={removePhotoFolder}
      maxPerCard={MAX_PER_CARD}
      onChangeCaption={onChangeImageCaption}
      onRemoveImage={handleRemoveImage}
      fileItems={fileItems}
      onAddFiles={onAddFiles}
      onChangeFileItemCaption={onChangeFileItemCaption}
      onRemoveFileItem={handleRemoveFileItem}
      maxFiles={MAX_FILES}
    />
  );
}
