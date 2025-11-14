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
  /** 1) 카드 이미지 → ImageItem[]로 정규화 (state/prop 아님: 계산 값만) */
  const itemsByCard: ImageItem[][] = React.useMemo(
    () =>
      images.imageFolders.map((folder) =>
        folder.map((img) => {
          // ImageItem 구조만 보장해주고, id 같은 서버 필드는 건드리지 않음
          const base: ImageItem = {
            ...(img as ImageItem),
            url: (img as any)?.url ?? "",
            name: (img as any)?.name ?? "",
          };
          return base;
        })
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
      // PhotoFolder.id 는 string 이라서 항상 문자열로 변환
      const rawId = g?.id ?? `folder-${idx}`;
      const id = String(rawId);
      const title = (g?.title ?? "").trim() || `사진 폴더 ${idx + 1}`;
      return { id, title, items };
    });
  }, [itemsByCard, images.groups]);

  /** 3) 세로 아이템 소스 선택 (fileItems 우선, 없으면 verticalImages) */
  const verticalSource: ImageItem[] =
    images.fileItems ?? images.verticalImages ?? [];

  /** 4) 세로 파일 정규화 → ResolvedFileItem[] */
  const fileItemsNormalized: ResolvedFileItem[] = React.useMemo(
    () =>
      verticalSource.map((img) => ({
        url: (img as any)?.url ?? "",
        name: (img as any)?.name ?? "",
        idbKey: (img as any)?.idbKey,
        // ResolvedFileItem에 id가 있다면 any로 얹어줌 (없어도 문제 없음)
        ...(typeof (img as any)?.id !== "undefined"
          ? { id: (img as any).id }
          : {}),
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
      const rawId = g?.id ?? `folder-${folderIdx}`;
      const groupId = String(rawId);
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
        /** ✅ 수정모달용: onPickFilesToFolder는 이제 "로컬에만" 추가 */
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
        /** 세로형(파일 대기열) */
        fileItems={fileItemsNormalized}
        onAddFiles={images.onAddFiles}
        onChangeFileItemCaption={images.onChangeFileItemCaption ?? (() => {})}
        onRemoveFileItem={images.handleRemoveFileItem}
        maxFiles={maxFiles}
      />
    </div>
  );
}
