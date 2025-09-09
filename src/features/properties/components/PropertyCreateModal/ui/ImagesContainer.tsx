"use client";

import * as React from "react";
import ImagesSection, {
  type ImageFile,
  // 만약 ImagesSection에서 FileItem 타입을 export 한다면 주석 해제:
  // type FileItem,
} from "../../sections/ImagesSection/ImagesSection";

// 레거시 원본 입력 타입 (훅에서 오는 것)
type Img = { idbKey?: string; url?: string; name?: string; caption?: string };

// 만약 FileItem 타입이 export되지 않는다면, 최소 필수 필드만 맞춘 로컬 타입 정의
type FileItemLocal = {
  url: string;
  name: string;
  caption?: string;
  idbKey?: string;
};

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
  // 1) 카드 이미지 정규화 (ImagesSection의 ImageFile 요구사항에 맞춤)
  const imagesByCard: ImageFile[][] = images.imageFolders.map((folder) =>
    folder.map((img) => ({
      url: img.url ?? "",
      name: img.name ?? "",
      caption: img.caption,
    }))
  );

  // 2) 파일 아이템 정규화: name/url 은 필수 string이어야 하므로 기본값 부여
  const fileItemsNormalized /* : FileItem[] */ = images.fileItems.map(
    (img) => ({
      url: img.url ?? "",
      name: img.name ?? "",
      caption: img.caption,
      idbKey: img.idbKey,
    })
  ) as unknown as FileItemLocal[]; // ← FileItem 타입 export 되면 FileItem[] 로 바꾸세요.

  return (
    <ImagesSection
      imagesByCard={imagesByCard}
      onOpenPicker={images.openImagePicker}
      onChangeFiles={images.onPickFilesToFolder} // (idx, e)
      registerInputRef={images.registerImageInput} // (idx, el)
      onAddPhotoFolder={images.addPhotoFolder}
      maxPerCard={images.maxPerCard}
      onChangeCaption={images.onChangeImageCaption}
      onRemoveImage={images.handleRemoveImage}
      fileItems={fileItemsNormalized as any} // FileItem export 시 as any 제거 가능
      onAddFiles={images.onAddFiles}
      onChangeFileItemCaption={images.onChangeFileItemCaption}
      onRemoveFileItem={images.handleRemoveFileItem}
      maxFiles={images.maxFiles}
    />
  );
}
