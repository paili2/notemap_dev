"use client";

import { useEffect, useRef } from "react";
import { MAX_FILES, MAX_PER_CARD } from "../../constants";
import ImagesSection, {
  ImageFile,
} from "../../sections/ImagesSection/ImagesSection";
import type { EditImagesAPI } from "../hooks/useEditImages";
import type { ResolvedFileItem } from "@/features/properties/types/media";

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

  // objectURL 수명 관리용
  const objectURLsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      objectURLsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectURLsRef.current = [];
    };
  }, []);

  // ImageItem[] -> ResolvedFileItem[]
  const fileItems: ResolvedFileItem[] = verticalImages.flatMap((it) => {
    const url =
      it.url ??
      it.dataUrl ??
      (it.file ? URL.createObjectURL(it.file) : undefined);

    // url을 전혀 만들 수 없는 항목은 제외 (또는 placeholder로 대체해도 됨)
    if (!url) return [];

    // 새로 만든 objectURL은 추후 revoke 위해 기록
    if (!it.url && !it.dataUrl && it.file) {
      objectURLsRef.current.push(url);
    }

    return [
      {
        name: it.name ?? it.file?.name ?? "",
        url,
        caption: it.caption ?? "",
        idbKey: it.idbKey,
      },
    ];
  });

  return (
    <ImagesSection
      imagesByCard={imageFolders as unknown as ImageFile[][]}
      onOpenPicker={openImagePicker}
      onChangeFiles={onPickFilesToFolder}
      registerInputRef={registerImageInput}
      onAddPhotoFolder={addPhotoFolder}
      onRemovePhotoFolder={removePhotoFolder}
      maxPerCard={MAX_PER_CARD}
      onChangeCaption={onChangeImageCaption}
      onRemoveImage={handleRemoveImage}
      fileItems={fileItems} // ✅ 확정 타입 전달
      onAddFiles={onAddFiles}
      onChangeFileItemCaption={onChangeFileItemCaption}
      onRemoveFileItem={handleRemoveFileItem}
      maxFiles={MAX_FILES}
    />
  );
}
