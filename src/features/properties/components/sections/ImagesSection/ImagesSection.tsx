"use client";

import { createRef, useEffect, useRef } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import ImageCarouselUpload from "@/components/organisms/ImageCarouselUpload/ImageCarouselUpload";
import { ImageItem, ResolvedFileItem } from "@/features/properties/types/media";
import { updatePhotos, deletePhotos } from "@/shared/api/photos";

/* ───────────────────────────────────────────
 * Types
 * ─────────────────────────────────────────── */
export type PhotoFolder = {
  id: string; // 폴더 식별자 (uuid 권장)
  title: string; // "사진 폴더 1" 등
  items: ImageItem[];
};

type RegisterRef =
  | ((idx: number) => (el: HTMLInputElement | null) => void)
  | ((idx: number, el: HTMLInputElement | null) => void);

type Props = {
  folders: PhotoFolder[];

  /** (폴더 인덱스) 파일 선택창 열기 */
  onOpenPicker: (folderIdx: number) => void;

  /** ✅ 가로형: 파일리스트만 위로 올림 (권장 새 시그니처) */
  onAddToFolder?: (folderIdx: number, files: FileList | null) => void;

  /** ⛔️ 레거시(하위호환): (idx, event) 시그니처 — 곧 제거 예정 */
  onChangeFiles?: (
    folderIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  /** (idx) => (el)=>…  또는 (idx, el) => void  모두 지원 */
  registerInputRef?: RegisterRef;

  /** 폴더 추가/삭제 */
  onAddFolder: () => void;
  onRemoveFolder?: (
    folderIdx: number,
    opts?: { keepAtLeastOne?: boolean }
  ) => void;

  /** 카드(폴더) 당 최대 업로드 장수 */
  maxPerCard: number;

  /** 캡션/삭제 (UI 상태 반영 콜백) */
  onChangeCaption?: (folderIdx: number, imageIdx: number, text: string) => void;
  onRemoveImage?: (folderIdx: number, imageIdx: number) => void;

  /** 세로형(파일 대기열) 영역 */
  fileItems: ResolvedFileItem[];
  onAddFiles: (files: FileList | null) => void;
  onChangeFileItemCaption?: (index: number, text: string) => void;
  onRemoveFileItem?: (index: number) => void;
  maxFiles: number;

  /** 선택: 서버에 대표/정렬/삭제 반영을 할지 끌 수 있음 (기본 true) */
  syncServer?: boolean;
};

/** 프로젝트 구조에 맞게 photoId를 꺼내는 도우미 */
const getPhotoId = (item: ImageItem) =>
  (item as any).id as number | string | undefined;

export default function ImagesSection({
  folders,
  onOpenPicker,
  onAddToFolder,
  onChangeFiles, // legacy
  registerInputRef,
  onAddFolder,
  onRemoveFolder,
  maxPerCard,
  onChangeCaption,
  onRemoveImage,
  fileItems,
  onAddFiles,
  onChangeFileItemCaption,
  onRemoveFileItem,
  maxFiles,
  syncServer = true,
}: Props) {
  const hasFolders = Array.isArray(folders) && folders.length > 0;

  // 폴더 없으면 기본 1개 생성 트리거 (상위 상태 갱신)
  useEffect(() => {
    if (!hasFolders) {
      try {
        onAddFolder?.();
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFolders]);

  // 시각적 플레이스홀더
  const renderFolders: PhotoFolder[] = hasFolders
    ? folders
    : [{ id: "__placeholder__", title: "사진 폴더 1", items: [] }];

  /* ─────────────────────────────
   * 서버 연동 핸들러 (낙관적 업데이트)
   * ───────────────────────────── */
  const handleCaptionChange = async (
    folderIdx: number,
    imageIdx: number,
    text: string
  ) => {
    onChangeCaption?.(folderIdx, imageIdx, text);
  };

  const handleRemove = async (folderIdx: number, imageIdx: number) => {
    const folder = renderFolders[folderIdx];
    const item = folder?.items?.[imageIdx];
    const photoId = getPhotoId(item);
    onRemoveImage?.(folderIdx, imageIdx); // UI 선삭제
    if (!syncServer || photoId == null) return;
    try {
      await deletePhotos([String(photoId)]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReorder = async (
    folderIdx: number,
    _fromIdx: number,
    toIdx: number
  ) => {
    const moved = renderFolders[folderIdx]?.items?.[toIdx];
    const photoId = getPhotoId(moved);
    if (!syncServer || photoId == null) return;
    try {
      await updatePhotos({ photoIds: [String(photoId)], sortOrder: toIdx });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetCover = async (folderIdx: number, imageIdx: number) => {
    const item = renderFolders[folderIdx]?.items?.[imageIdx];
    const photoId = getPhotoId(item);
    if (!syncServer || photoId == null) return;
    try {
      await updatePhotos({ photoIds: [String(photoId)], isCover: true });
    } catch (e) {
      console.error(e);
    }
  };

  /* ─────────────────────────────
   * ref 유지/전달
   * ───────────────────────────── */
  const cardInputRefs = useRef<Array<React.RefObject<HTMLInputElement>>>([]);
  if (cardInputRefs.current.length !== renderFolders.length) {
    cardInputRefs.current = Array.from(
      { length: renderFolders.length },
      (_, i) => cardInputRefs.current[i] ?? createRef<HTMLInputElement>()
    );
  }

  const prevNodesRef = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    if (!registerInputRef) return;

    const nextNodes = cardInputRefs.current.map((r) => r.current ?? null);
    const prevNodes = prevNodesRef.current;

    for (let i = 0; i < nextNodes.length; i++) {
      if (prevNodes[i] !== nextNodes[i]) {
        try {
          const maybeCb = (registerInputRef as any)(i);
          if (typeof maybeCb === "function") maybeCb(nextNodes[i]);
          else (registerInputRef as any)(i, nextNodes[i]);
        } catch {
          (registerInputRef as any)(i, nextNodes[i]);
        }
      }
    }
    prevNodesRef.current = nextNodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderFolders.length, registerInputRef]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="flex flex-col gap-3">
      {/* 가로형 이미지 카드들 */}
      {renderFolders.map((folder, idx) => (
        <div key={folder.id ?? idx} className="rounded-xl border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {folder.title || `사진 폴더 ${idx + 1}`}
            </h4>
            <div className="flex items-center gap-2">
              {idx > 0 && hasFolders && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  aria-label={`사진 폴더 ${idx + 1} 삭제`}
                  onClick={() => onRemoveFolder?.(idx)}
                >
                  폴더 삭제
                </Button>
              )}
            </div>
          </div>

          <ImageCarouselUpload
            items={folder.items}
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
            // ✅ 통일된 시그니처: FileList만 상위로 전달
            onChangeFiles={(e) => {
              const files = e?.target?.files ?? null;
              if (onAddToFolder) onAddToFolder(idx, files);
              else if (onChangeFiles) onChangeFiles(idx, e); // 하위호환
            }}
            // (선택) DnD/대표 지정
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
        onClick={onAddFolder}
      >
        <FolderPlus className="h-4 w-4" />
        사진 폴더 추가
      </Button>
    </section>
  );
}
