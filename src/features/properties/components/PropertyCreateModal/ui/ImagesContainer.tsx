"use client";

import * as React from "react";
import ImagesSection from "../../sections/ImagesSection/ImagesSection";
import type {
  ImageItem,
  ResolvedFileItem,
} from "@/features/properties/types/media";

// 레거시 원본 입력 타입 (훅에서 오는 것)
type Img = { idbKey?: string; url?: string; name?: string; caption?: string };

export default function ImagesContainer({
  images,
}: {
  images: {
    imageFolders: Img[][];
    fileItems: Img[];

    registerImageInput: (idx: number, el: HTMLInputElement | null) => void;
    openImagePicker: (folderIndex: number) => void;
    onPickFilesToFolder: (
      folderIndex: number,
      e: React.ChangeEvent<HTMLInputElement>
    ) => void | Promise<void>;

    addPhotoFolder: () => void;
    removePhotoFolder: (
      folderIdx: number,
      opts?: { keepAtLeastOne?: boolean }
    ) => void;
    onChangeImageCaption: (
      folderIndex: number,
      imageIndex: number,
      v: string
    ) => void;
    handleRemoveImage: (folderIndex: number, imageIndex: number) => void;

    onAddFiles: (files: FileList | null) => void;
    onChangeFileItemCaption: (index: number, v: string) => void;
    handleRemoveFileItem: (index: number) => void;

    maxPerCard: number;
    maxFiles: number;
  };
}) {
  // 1) 카드 이미지 정규화 (ImagesSection의 ImageItem 요구사항에 맞춤)
  const imagesByCard: ImageItem[][] = images.imageFolders.map((folder) =>
    folder.map((img) => ({
      // ImageItem에서 필수인 최소 속성만 안전하게 매핑
      url: img.url ?? "",
      name: img.name ?? "",
      caption: img.caption,
      // 서버에서 내려온 id가 있다면 보존(대표 지정/삭제 등에서 사용 가능)
      ...((img as any).id ? { id: (img as any).id } : {}),
    }))
  );

  // 2) 파일 아이템 정규화: 업로드 대기 목록 → ResolvedFileItem[]
  const fileItemsNormalized: ResolvedFileItem[] = images.fileItems.map(
    (img) => ({
      url: img.url ?? "",
      name: img.name ?? "",
      caption: img.caption,
      idbKey: img.idbKey, // 로컬 식별자 유지
      ...((img as any).id ? { id: (img as any).id } : {}),
    })
  );

  return (
    <ImagesSection
      imagesByCard={imagesByCard}
      onOpenPicker={images.openImagePicker}
      onChangeFiles={images.onPickFilesToFolder} // (idx, e)
      registerInputRef={images.registerImageInput} // (idx, el)
      onAddPhotoFolder={images.addPhotoFolder}
      onRemovePhotoFolder={images.removePhotoFolder}
      maxPerCard={images.maxPerCard}
      onChangeCaption={images.onChangeImageCaption}
      onRemoveImage={images.handleRemoveImage}
      fileItems={fileItemsNormalized}
      onAddFiles={images.onAddFiles}
      onChangeFileItemCaption={images.onChangeFileItemCaption}
      onRemoveFileItem={images.handleRemoveFileItem}
      maxFiles={images.maxFiles}
    />
  );
}
