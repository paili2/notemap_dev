// src/features/properties/components/PropertyEditModal/ui/ImagesContainer.tsx
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

    /** ⬇️ 폴더 제목 편집용 (useEditImages에서 내려오는 값들; 없으면 기본제목 사용) */
    groups?: Array<{ id: string; title?: string | null }>;
    queueGroupTitle?: (groupId: string, title: string) => void;

    /** 세로 파일 조작 */
    onAddFiles: (files: FileList | null) => void;
    onChangeFileItemCaption?: (index: number, v: string) => void; // (선택) 더이상 사용 안 해도 OK
    handleRemoveFileItem: (index: number) => void;

    /** 제한값 (없으면 기본값) */
    maxPerCard?: number;
    maxFiles?: number;
  };
}) {
  /** 1) 카드 이미지 → ImageItem[]로 정규화 (state/prop 아님: 계산 값만) */
  const itemsByCard: ImageItem[][] = React.useMemo(
    () =>
      images.imageFolders.map((folder) =>
        folder.map((img) => ({
          url: img?.url ?? "",
          name: img?.name ?? "",
          // 사진별 캡션은 더 이상 쓰지 않음 (폴더 단위 제목으로 전환)
          ...(img?.id ? { id: img.id } : {}),
        }))
      ),
    [images.imageFolders]
  );

  /** 2) folders prop으로 변환
   *  - groups가 있으면 group.id / group.title 사용
   *  - 없으면 인덱스 기반 가짜 id와 기본 제목 사용
   */
  const folders: PhotoFolder[] = React.useMemo(() => {
    const gs = images.groups ?? [];
    return itemsByCard.map((items, idx) => {
      const g = gs[idx];
      const id = g?.id ?? `folder-${idx}`;
      const title = (g?.title ?? "").trim() || `사진 폴더 ${idx + 1}`;
      return { id, title, items };
    });
  }, [itemsByCard, images.groups]);

  /** 3) 세로 아이템 소스 선택 (fileItems 우선, 없으면 verticalImages) */
  const verticalSource: Img[] = images.fileItems ?? images.verticalImages ?? [];

  /** 4) 세로 파일 정규화 → ResolvedFileItem[] */
  const fileItemsNormalized: ResolvedFileItem[] = React.useMemo(
    () =>
      verticalSource.map((img) => ({
        url: img?.url ?? "",
        name: img?.name ?? "",
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

  /** 7) 폴더 제목 변경 콜백: index -> groupId로 매핑해서 큐에 반영 */
  const handleChangeFolderTitle = React.useCallback(
    (folderIdx: number, nextTitle: string) => {
      const gs = images.groups ?? [];
      const g = gs[folderIdx];
      const groupId = g?.id ?? `folder-${folderIdx}`; // fallback
      images.queueGroupTitle?.(groupId, nextTitle);
    },
    [images.groups, images.queueGroupTitle]
  );

  return (
    // ✅ 오버레이/파일 인풋이 섹션 경계를 넘어 확장되지 않도록 relative로 감쌈
    <div className="relative z-0" data-images-root>
      <ImagesSection
        /** ✅ 폴더 구조 & 제목 전달 */
        folders={folders}
        onChangeFolderTitle={handleChangeFolderTitle}
        /** 파일 선택창 열기 */
        onOpenPicker={images.openImagePicker}
        /** ✅ 레거시 시그니처 그대로 연결 */
        onChangeFiles={images.onPickFilesToFolder}
        /** ref 등록 */
        registerInputRef={registerInputRef}
        /** 폴더 조작 */
        onAddFolder={images.addPhotoFolder}
        onRemoveFolder={images.removePhotoFolder}
        /** 제한값 */
        maxPerCard={maxPerCard}
        /** ⛔️ 사진 개별 캡션/편집은 사용 중단 → 안전한 no-op 전달 */
        onChangeCaption={() => {}}
        onRemoveImage={() => {}}
        /** 세로형(파일 대기열) – 캡션 사용 안해도 무방 */
        fileItems={fileItemsNormalized}
        onAddFiles={images.onAddFiles}
        onChangeFileItemCaption={images.onChangeFileItemCaption ?? (() => {})}
        onRemoveFileItem={images.handleRemoveFileItem}
        maxFiles={maxFiles}
      />
    </div>
  );
}
