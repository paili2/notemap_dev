"use client";

import * as React from "react";
import ImagesSection, {
  type PhotoFolder,
} from "../../sections/ImagesSection/ImagesSection";
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
  /** 1) 카드 이미지 → ImageItem[]로 정규화 */
  const imageItemsByCard: ImageItem[][] = React.useMemo(
    () =>
      images.imageFolders.map((folder) =>
        folder.map((img) => ({
          url: img?.url ?? "",
          name: img?.name ?? "",
          caption: img?.caption,
          ...(img?.id ? { id: img.id } : {}),
        }))
      ),
    [images.imageFolders]
  );

  /** 2) folders prop으로 변환 (id/title은 인덱스 기반으로 안정 생성) */
  const folders: PhotoFolder[] = React.useMemo(
    () =>
      imageItemsByCard.map((items, idx) => ({
        id: `folder-${idx}`,
        title: `사진 폴더 ${idx + 1}`,
        items,
      })),
    [imageItemsByCard]
  );

  /** 3) 세로 아이템 소스 선택 (fileItems 우선, 없으면 verticalImages) */
  const verticalSource: Img[] = images.fileItems ?? images.verticalImages ?? [];

  /** 4) 세로 파일 정규화 → ResolvedFileItem[] */
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

  /** 5) 제한값 디폴트 */
  const maxPerCard = images.maxPerCard ?? 20;
  const maxFiles = images.maxFiles ?? 200;

  /** 6) ref 시그니처 통일 래퍼 (그대로 전달) */
  const registerInputRef = images.registerImageInput;

  return (
    <ImagesSection
      /** ✅ 새 API: 폴더 구조 전달 */
      folders={folders}
      /** 파일 선택창 열기 */
      onOpenPicker={images.openImagePicker}
      /** ✅ 레거시 시그니처 그대로 연결 (onAddToFolder 없이도 동작) */
      onChangeFiles={images.onPickFilesToFolder}
      /** ref 등록 */
      registerInputRef={registerInputRef}
      /** 폴더 조작 */
      onAddFolder={images.addPhotoFolder}
      onRemoveFolder={images.removePhotoFolder}
      /** 제한값 */
      maxPerCard={maxPerCard}
      /** 가로형 카드 내 이미지 편집 콜백 */
      onChangeCaption={images.onChangeImageCaption}
      onRemoveImage={images.handleRemoveImage}
      /** 세로형(파일 대기열) */
      fileItems={fileItemsNormalized}
      onAddFiles={images.onAddFiles}
      onChangeFileItemCaption={images.onChangeFileItemCaption}
      onRemoveFileItem={images.handleRemoveFileItem}
      maxFiles={maxFiles}
    />
  );
}
