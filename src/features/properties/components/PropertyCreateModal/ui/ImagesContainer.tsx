"use client";

import * as React from "react";
import ImagesSection from "../../sections/ImagesSection/ImagesSection";
import type {
  ImageItem,
  ResolvedFileItem,
} from "@/features/properties/types/media";

// 레거시 원본 입력 타입 (훅에서 오는 것)
type Img = {
  id?: string;
  idbKey?: string;
  url?: string;
  name?: string;
  caption?: string;
};

export default function ImagesContainer({
  images,
}: {
  images: {
    /** 카드(좌측) */
    imageFolders: Img[][];
    /** 세로(우측) – 프로젝트별로 verticalImages 또는 fileItems 중 하나 사용 */
    verticalImages?: Img[];
    fileItems?: Img[];

    /** ref 연결 & 파일 열기/선택 */
    registerImageInput: {
      (idx: number): (el: HTMLInputElement | null) => void; // 새 권장 방식
      (idx: number, el: HTMLInputElement | null): void; // 과거 방식 호환
    };
    openImagePicker: (folderIndex: number) => void;
    onPickFilesToFolder: (
      folderIndex: number,
      e: React.ChangeEvent<HTMLInputElement>
    ) => void | Promise<void>;

    /** 카드 폴더 조작 & 편집 */
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

    /** 세로 파일 조작 */
    onAddFiles: (files: FileList | null) => void;
    onChangeFileItemCaption: (index: number, v: string) => void;
    handleRemoveFileItem: (index: number) => void;

    /** 제한값 (없으면 기본값) */
    maxPerCard?: number;
    maxFiles?: number;
  };
}) {
  /** 1) 카드 이미지 정규화 (ImagesSection의 ImageItem 요구사항에 맞춤) */
  const imagesByCard: ImageItem[][] = React.useMemo(
    () =>
      images.imageFolders.map((folder) =>
        folder.map((img) => ({
          // ImageItem의 최소 필드
          url: img?.url ?? "",
          name: img?.name ?? "",
          caption: img?.caption,
          ...(img?.id ? { id: img.id } : {}),
        }))
      ),
    [images.imageFolders]
  );

  /** 2) 세로 아이템 소스 선택 (fileItems 우선, 없으면 verticalImages) */
  const verticalSource: Img[] = images.fileItems ?? images.verticalImages ?? [];

  /** 3) 세로 파일 정규화 → ResolvedFileItem[] */
  const fileItemsNormalized: ResolvedFileItem[] = React.useMemo(
    () =>
      verticalSource.map((img) => ({
        url: img?.url ?? "",
        name: img?.name ?? "",
        caption: img?.caption,
        idbKey: img?.idbKey,
        ...(img?.id ? { id: img.id } : {}),
      })),
    [verticalSource]
  );

  /** 4) 제한값 디폴트 */
  const maxPerCard = images.maxPerCard ?? 20;
  const maxFiles = images.maxFiles ?? 200;

  /** 5) (선택) 타입 안정 래퍼 – 현재는 그대로 전달해도 안전하지만,
   *    타입 추론을 돕기 위해 래핑함. (루프 방지는 useEditImages 쪽에서 이미 처리)
   */
  const registerInputRef = images.registerImageInput;

  return (
    <ImagesSection
      imagesByCard={imagesByCard}
      onOpenPicker={images.openImagePicker}
      onChangeFiles={images.onPickFilesToFolder} // (folderIdx, e)
      registerInputRef={registerInputRef} // (idx) 또는 (idx, el)
      onAddPhotoFolder={images.addPhotoFolder}
      onRemovePhotoFolder={images.removePhotoFolder}
      maxPerCard={maxPerCard}
      onChangeCaption={images.onChangeImageCaption}
      onRemoveImage={images.handleRemoveImage}
      fileItems={fileItemsNormalized}
      onAddFiles={images.onAddFiles}
      onChangeFileItemCaption={images.onChangeFileItemCaption}
      onRemoveFileItem={images.handleRemoveFileItem}
      maxFiles={maxFiles}
    />
  );
}
