"use client";

import { FolderPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import ImageCarouselUpload from "@/components/organisms/ImageCarouselUpload/ImageCarouselUpload";
import { ImageItem, ResolvedFileItem } from "@/features/properties/types/media";
import React, { useEffect, useRef } from "react";

import { updatePhotos, deletePhotos } from "@/shared/api/pinPhotos";

type Props = {
  imagesByCard: ImageItem[][];
  onOpenPicker: (idx: number) => void;
  onChangeFiles: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;

  /** (idx) => (el)=>…  또는 (idx, el) => void  모두 지원 */
  registerInputRef?: {
    (idx: number): (el: HTMLInputElement | null) => void;
    (idx: number, el: HTMLInputElement | null): void;
  };

  onAddPhotoFolder: () => void;
  onRemovePhotoFolder?: (
    folderIdx: number,
    opts?: { keepAtLeastOne?: boolean }
  ) => void;
  maxPerCard: number;

  onChangeCaption?: (cardIdx: number, imageIdx: number, text: string) => void;
  onRemoveImage?: (cardIdx: number, imageIdx: number) => void;

  fileItems: ResolvedFileItem[];
  onAddFiles: (files: FileList | null) => void;
  onChangeFileItemCaption?: (index: number, text: string) => void;
  onRemoveFileItem?: (index: number) => void;

  maxFiles: number;

  pinId?: number | string; // 선택
};

// 프로젝트 구조에 맞게 photoId를 꺼내는 도우미
const getPhotoId = (item: ImageItem) =>
  (item as any).id as number | string | undefined;

export default function ImagesSection(props: Props) {
  const {
    imagesByCard,
    onOpenPicker,
    onChangeFiles,
    registerInputRef,
    onAddPhotoFolder,
    onRemovePhotoFolder,
    maxPerCard,
    onChangeCaption,
    onRemoveImage,
    fileItems,
    onAddFiles,
    onChangeFileItemCaption,
    onRemoveFileItem,
    maxFiles,
  } = props;

  const list = imagesByCard?.length ? imagesByCard : [[]];

  /* ─────────────────────────────
   * 서버 연동 핸들러 (낙관적 업데이트)
   * ───────────────────────────── */

  // ⚠️ 백엔드에 caption 필드가 없으므로 서버 호출은 생략하고
  //    로컬 UI만 선적용 (필요하면 백엔드 DTO에 caption 추가 후 복구)
  const handleCaptionChange = async (
    cardIdx: number,
    imageIdx: number,
    text: string
  ) => {
    onChangeCaption?.(cardIdx, imageIdx, text); // UI만 반영
    // 서버 저장 필요 시 별도 caption API 호출로 확장
  };

  const handleRemove = async (cardIdx: number, imageIdx: number) => {
    const item = list[cardIdx][imageIdx];
    const photoId = getPhotoId(item);
    onRemoveImage?.(cardIdx, imageIdx); // UI 선삭제
    if (photoId == null) return; // 임시 파일이면 서버 호출 불필요
    try {
      await deletePhotos([String(photoId)]);
    } catch (e) {
      console.error(e);
      // 실패 시 복구 로직 필요하면 여기서 되돌리기
    }
  };

  // DnD 정렬(있다면) → 서버엔 sortOrder로 반영
  const handleReorder = async (
    cardIdx: number,
    fromIdx: number,
    toIdx: number
  ) => {
    // UI 정렬은 상위에서 처리
    const moved = list[cardIdx][toIdx];
    const photoId = getPhotoId(moved);
    if (photoId == null) return;
    try {
      await updatePhotos({ photoIds: [String(photoId)], sortOrder: toIdx });
    } catch (e) {
      console.error(e);
    }
  };

  // 대표 지정
  const handleSetCover = async (cardIdx: number, imageIdx: number) => {
    const item = list[cardIdx][imageIdx];
    const photoId = getPhotoId(item);
    if (photoId == null) return;
    try {
      await updatePhotos({ photoIds: [String(photoId)], isCover: true });
      // UI에서 isCover 토글 반영 필요 시 상위 상태 업데이트 로직 호출
    } catch (e) {
      console.error(e);
    }
  };

  /* ─────────────────────────────
   * ref 유지/전달
   * - 인덱스별 RefObject를 재사용
   * - 실제 DOM 노드 변경시에만 registerInputRef 호출
   * ───────────────────────────── */
  const cardInputRefs = useRef<Array<React.RefObject<HTMLInputElement>>>([]);
  // 길이 맞추기 (기존 인스턴스 최대 재사용)
  if (cardInputRefs.current.length !== list.length) {
    cardInputRefs.current = Array.from(
      { length: list.length },
      (_, i) => cardInputRefs.current[i] ?? React.createRef<HTMLInputElement>()
    );
  }

  const prevNodesRef = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    if (!registerInputRef) return;

    const nextNodes = cardInputRefs.current.map((r) => r.current ?? null);
    const prevNodes = prevNodesRef.current;

    // 변경된 인덱스만 반영
    for (let i = 0; i < nextNodes.length; i++) {
      if (prevNodes[i] !== nextNodes[i]) {
        try {
          // 1) (idx) => (el)=>… 형태 지원 시
          const maybeCb = (registerInputRef as any)(i);
          if (typeof maybeCb === "function") {
            maybeCb(nextNodes[i]);
          } else {
            // 2) (idx, el) 형태만 지원 시
            (registerInputRef as any)(i, nextNodes[i]);
          }
        } catch {
          // (idx, el) 시그니처만 있는 경우
          (registerInputRef as any)(i, nextNodes[i]);
        }
      }
    }

    // 스냅샷 교체
    prevNodesRef.current = nextNodes;
    // list.length만 의존: 노드 교체 타이밍에만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, registerInputRef]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="flex flex-col gap-3">
      {/* 가로형 이미지 카드들 */}
      {list.map((files, idx) => (
        <div key={idx} className="rounded-xl border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">사진 폴더 {idx + 1}</h4>
            <div className="flex items-center gap-2">
              {idx > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  aria-label={`사진 폴더 ${idx + 1} 삭제`}
                  onClick={() => onRemovePhotoFolder?.(idx)}
                >
                  폴더 삭제
                </Button>
              )}
            </div>
          </div>

          <ImageCarouselUpload
            items={files}
            maxCount={maxPerCard}
            layout="wide"
            wideAspectClass="aspect-video"
            objectFit="cover"
            onChangeCaption={(imageIdx, text) =>
              handleCaptionChange(idx, imageIdx, text)
            }
            onRemoveImage={(imageIdx) => handleRemove(idx, imageIdx)}
            onOpenPicker={() => onOpenPicker(idx)}
            inputRef={cardInputRefs.current[idx]}
            onChangeFiles={(e) => onChangeFiles(idx, e)}
            // (선택)
            // onReorder={(from, to) => handleReorder(idx, from, to)}
            // onSetCover={(imageIdx) => handleSetCover(idx, imageIdx)}
          />
        </div>
      ))}

      {/* 세로형(파일) 카드 — 서버 등록 전 파일 영역 */}
      <ImageCarouselUpload
        items={fileItems}
        maxCount={maxFiles}
        layout="tall"
        tallHeightClass="h-80"
        objectFit="cover"
        onChangeCaption={(i, text) => onChangeFileItemCaption?.(i, text)}
        onRemoveImage={(i) => onRemoveFileItem?.(i)}
        onOpenPicker={() => fileInputRef.current?.click()}
        inputRef={fileInputRef}
        onChangeFiles={(e) => onAddFiles(e.target.files)}
      />

      <Button
        type="button"
        variant="ghost"
        className="h-10 w-full justify-start gap-2"
        onClick={onAddPhotoFolder}
      >
        <FolderPlus className="h-4 w-4" />
        사진 폴더 추가
      </Button>
    </section>
  );
}
