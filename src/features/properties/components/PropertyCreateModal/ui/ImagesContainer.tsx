"use client";

import * as React from "react";
import ImagesSection, {
  type PhotoFolder,
} from "../../sections/ImagesSection/ImagesSection";
import type {
  ImageItem,
  ResolvedFileItem,
} from "@/features/properties/types/media";

export default function ImagesContainer({
  images,
}: {
  images: {
    /** 카드(좌측) – useEditImages의 imageFolders 그대로 */
    imageFolders: ImageItem[][];
    /** 세로(우측) – 프로젝트별로 verticalImages 또는 fileItems 중 하나 사용 */
    verticalImages?: ImageItem[];
    fileItems?: ImageItem[];

    /** ref 연결 & 파일 열기/선택 */
    registerImageInput: {
      (idx: number): (el: HTMLInputElement | null) => void;
      (idx: number, el: HTMLInputElement | null): void;
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

    /** ⬇️ 폴더 제목 편집용 (useEditImages에서 내려오는 값들; 없으면 기본제목 사용) */
    groups?: Array<{ id: string | number; title?: string | null }>;
    queueGroupTitle?: (groupId: string, title: string) => void;

    /** 세로 파일 조작 */
    onAddFiles: (files: FileList | null) => void;
    onChangeFileItemCaption?: (index: number, v: string) => void;
    handleRemoveFileItem: (index: number) => void;

    /** 제한값 (없으면 기본값) */
    maxPerCard?: number;
    maxFiles?: number;
  };
}) {
  /** 1) 카드 이미지 정규화 */
  const itemsByCard: ImageItem[][] = React.useMemo(
    () =>
      images.imageFolders.map((folder) =>
        folder.map((img) => {
          const base = img as ImageItem;
          return {
            ...base,
            url:
              typeof (base as any).url === "string"
                ? (base as any).url
                : undefined,
            name:
              typeof (base as any).name === "string" ? (base as any).name : "",
          };
        })
      ),
    [images.imageFolders]
  );

  /** 2) folders prop 변환 */
  const folders: PhotoFolder[] = React.useMemo(() => {
    const gs = images.groups ?? [];
    return itemsByCard.map((items, idx) => {
      const g = gs[idx];
      const rawId = g?.id ?? `folder-${idx}`;
      const id = String(rawId);
      const title = (g?.title ?? "").trim() || `사진 폴더 ${idx + 1}`;
      return { id, title, items };
    });
  }, [itemsByCard, images.groups]);

  /** 3) 세로 아이템 소스 선택 */
  const verticalSource: ImageItem[] =
    images.fileItems ?? images.verticalImages ?? [];

  /** 4) 세로 파일 정규화 → ResolvedFileItem[] */
  const fileItemsNormalized: ResolvedFileItem[] = React.useMemo(
    () =>
      verticalSource.map((img) => ({
        url: (img as any)?.url ?? "",
        name: (img as any)?.name ?? "",
        // ✅ 세로 폴더 제목 보존을 위해 caption도 유지
        caption: (img as any)?.caption ?? "",
        idbKey: (img as any)?.idbKey,
        ...(typeof (img as any)?.id !== "undefined"
          ? { id: (img as any).id }
          : {}),
      })),
    [verticalSource]
  );

  /** 4-1) 세로 폴더 제목: 첫번째 아이템의 caption을 폴더제목으로 사용 */
  const verticalFolderTitle = React.useMemo(() => {
    const first = verticalSource[0] as any;
    if (!first) return "";
    const cap = first?.caption;
    return typeof cap === "string" ? cap : "";
  }, [verticalSource]);

  /** 5) 제한값 디폴트 */
  const maxPerCard = images.maxPerCard ?? 20;
  const maxFiles = images.maxFiles ?? 200;

  /** 6) ref 래퍼 */
  const registerInputRef = images.registerImageInput;

  /** 7) 가로 폴더 제목 변경 → groupId로 매핑 */
  const handleChangeFolderTitle = React.useCallback(
    (folderIdx: number, nextTitle: string) => {
      const gs = images.groups ?? [];
      const g = gs[folderIdx];
      const rawId = g?.id ?? `folder-${folderIdx}`;
      const groupId = String(rawId);
      images.queueGroupTitle?.(groupId, nextTitle);
    },
    [images.groups, images.queueGroupTitle]
  );

  return (
    <div className="relative z-0" data-images-root>
      <ImagesSection
        /** 가로 폴더 */
        folders={folders}
        onChangeFolderTitle={handleChangeFolderTitle}
        onOpenPicker={images.openImagePicker}
        onChangeFiles={images.onPickFilesToFolder}
        registerInputRef={registerInputRef}
        onAddFolder={images.addPhotoFolder}
        onRemoveFolder={images.removePhotoFolder}
        maxPerCard={maxPerCard}
        /** 개별 사진 캡션은 사용 안 함 */
        onChangeCaption={() => {}}
        onRemoveImage={() => {}}
        /** 세로 폴더 (파일 대기열) */
        fileItems={fileItemsNormalized}
        onAddFiles={images.onAddFiles}
        onChangeFileItemCaption={images.onChangeFileItemCaption ?? (() => {})}
        onRemoveFileItem={images.handleRemoveFileItem}
        maxFiles={maxFiles}
        /** ✅ 세로 폴더 제목 (생성모달은 로컬 상태만) */
        verticalFolderTitle={verticalFolderTitle}
      />
    </div>
  );
}
