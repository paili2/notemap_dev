"use client";

import { useEffect, useRef } from "react";
import { MAX_FILES, MAX_PER_CARD } from "../../constants";
import ImagesSection, {
  type PhotoFolder,
} from "../../sections/ImagesSection/ImagesSection";
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
    onPickFilesToFolder, // (folderIdx, e)
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

  /** 1) 카드 이미지: EditImagesAPI.imageFolders -> PhotoFolder[] */
  const folders: PhotoFolder[] = imageFolders.map((folder, idx) => {
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
  });

  /** 2) 세로형(업로드 대기) 파일들: ImageItem[] -> ResolvedFileItem[] */
  const fileItems: ResolvedFileItem[] = verticalImages.flatMap((it) => {
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
  });

  /** 3) 새 시그니처에 맞춘 어댑터: (idx, FileList|null) -> 기존 onPickFilesToFolder 호출 */
  const addToFolder = (folderIdx: number, files: FileList | null) => {
    // 부모 훅은 e.target.files를 참조하므로 최소 형태의 이벤트 객체로 감싸서 전달
    const evt = {
      target: { files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    return onPickFilesToFolder(folderIdx, evt);
  };

  return (
    <ImagesSection
      /* 폴더(가로형 카드) */
      folders={folders}
      onOpenPicker={openImagePicker}
      onAddToFolder={addToFolder} // ✅ FileList만 올리는 새 시그니처
      // onChangeFiles={onPickFilesToFolder} // ⛔ 레거시: 필요하면 주석 해제
      registerInputRef={registerImageInput}
      onAddFolder={addPhotoFolder}
      onRemoveFolder={removePhotoFolder}
      maxPerCard={MAX_PER_CARD}
      onChangeCaption={onChangeImageCaption}
      onRemoveImage={handleRemoveImage}
      /* 세로형(파일 대기열) */
      fileItems={fileItems}
      onAddFiles={onAddFiles}
      onChangeFileItemCaption={onChangeFileItemCaption}
      onRemoveFileItem={handleRemoveFileItem}
      maxFiles={MAX_FILES}
    />
  );
}
