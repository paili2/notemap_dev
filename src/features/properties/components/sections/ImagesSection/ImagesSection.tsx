"use client";

import type React from "react";
import { createRef, useEffect, useRef } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import ImageCarouselUpload from "@/components/organisms/ImageCarouselUpload/ImageCarouselUpload";
import { ImageItem, ResolvedFileItem } from "@/features/properties/types/media";

export type PhotoFolder = {
  id: string;
  title: string;
  items: ImageItem[];
};

type RegisterRef =
  | ((idx: number) => (el: HTMLInputElement | null) => void)
  | ((idx: number, el: HTMLInputElement | null) => void);

type Props = {
  /* 가로 폴더(카드형) */
  folders: PhotoFolder[];
  onChangeFolderTitle?: (folderIdx: number, nextTitle: string) => void;
  onOpenPicker: (folderIdx: number) => void;

  /** 새 시그니처: (idx, FileList|null) */
  onAddToFolder?: (
    folderIdx: number,
    files: FileList | null
  ) => void | Promise<void>;

  /** 레거시 시그니처: (idx, ChangeEvent<HTMLInputElement>) */
  onChangeFiles?: (
    folderIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void | Promise<void>;

  registerInputRef?: RegisterRef;
  onAddFolder: () => void;
  onRemoveFolder?: (
    folderIdx: number,
    opts?: { keepAtLeastOne?: boolean }
  ) => void;

  maxPerCard: number;

  onChangeCaption?: (folderIdx: number, imageIdx: number, text: string) => void;
  onRemoveImage?: (folderIdx: number, imageIdx: number) => void;

  /* 세로형 파일 대기열(= 폴더 1개) */
  fileItems: ResolvedFileItem[];
  onAddFiles: (files: FileList | null) => void;

  /** 세로 폴더 제목 변경 → photo-group title 변경 */
  onChangeVerticalFolderTitle?: (nextTitle: string) => void;

  /** 필요하면 세로 이미지 개별 캡션 */
  onChangeFileItemCaption?: (index: number, text: string) => void;
  onRemoveFileItem?: (index: number) => void;
  maxFiles: number;

  /** 세로 폴더의 현재 제목 */
  verticalFolderTitle?: string;

  // 아직 ImageCarouselUpload가 안 받으니까 여기선 안 씀
  onReorder?: (
    photoId: number | string | undefined,
    to: number
  ) => void | Promise<void>;
  onSetCover?: (photoId: number | string | undefined) => void | Promise<void>;

  syncServer?: boolean;
};

export default function ImagesSection({
  folders,
  onChangeFolderTitle,
  onOpenPicker,
  onAddToFolder,
  onChangeFiles,
  registerInputRef,
  onAddFolder,
  onRemoveFolder,
  maxPerCard,
  onChangeCaption,
  onRemoveImage,
  fileItems,
  onAddFiles,
  onChangeVerticalFolderTitle,
  onChangeFileItemCaption,
  onRemoveFileItem,
  maxFiles,
  verticalFolderTitle,
}: Props) {
  const hasFolders = Array.isArray(folders) && folders.length > 0;

  useEffect(() => {
    if (!hasFolders) onAddFolder?.();
  }, [hasFolders, onAddFolder]);

  const renderFolders: PhotoFolder[] = hasFolders
    ? folders
    : [{ id: "__placeholder__", title: "", items: [] }];

  const handleRemove = (folderIdx: number, imageIdx: number) => {
    onRemoveImage?.(folderIdx, imageIdx);
  };

  /* 가로 폴더 input refs (ImageCarouselUpload 에 넘길 RefObject) */
  const cardInputRefs = useRef<Array<React.RefObject<HTMLInputElement>>>([]);
  if (cardInputRefs.current.length !== renderFolders.length) {
    cardInputRefs.current = Array.from(
      { length: renderFolders.length },
      (_, i) => cardInputRefs.current[i] ?? createRef<HTMLInputElement>()
    );
  }

  // registerInputRef 와 실제 DOM 노드를 동기화
  const prevNodesRef = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    if (!registerInputRef) return;
    const nextNodes = cardInputRefs.current.map((r) => r.current ?? null);
    const prevNodes = prevNodesRef.current;

    for (let i = 0; i < nextNodes.length; i++) {
      if (prevNodes[i] !== nextNodes[i]) {
        try {
          const maybeCb = (registerInputRef as any)(i);
          if (typeof maybeCb === "function") {
            maybeCb(nextNodes[i]);
          } else {
            (registerInputRef as any)(i, nextNodes[i]);
          }
        } catch {
          (registerInputRef as any)(i, nextNodes[i]);
        }
      }
    }

    prevNodesRef.current = nextNodes;
  }, [renderFolders.length, registerInputRef]);

  /* 세로 폴더 input */
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      className="relative z-0 isolate flex flex-col gap-3"
      data-images-root
    >
      {/* 가로 폴더들 */}
      {renderFolders.map((folder, idx) => {
        const fallbackLabel = `사진 폴더 ${idx + 1}`;
        const titleForInput =
          !folder.title || /^사진\s*폴더\s*\d+$/i.test(folder.title.trim())
            ? ""
            : folder.title;

        return (
          <div
            key={folder.id ?? idx}
            className="image-card rounded-xl border p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-700">
                {fallbackLabel}
              </div>
              {idx > 0 && hasFolders && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={() => onRemoveFolder?.(idx)}
                >
                  폴더 삭제
                </Button>
              )}
            </div>

            <ImageCarouselUpload
              items={folder.items}
              maxCount={maxPerCard}
              layout="wide"
              wideAspectClass="aspect-video"
              objectFit="cover"
              captionAsFolderTitle
              folderTitle={titleForInput}
              onChangeFolderTitle={(text) => onChangeFolderTitle?.(idx, text)}
              onRemoveImage={(imageIdx) => handleRemove(idx, imageIdx)}
              onOpenPicker={() => onOpenPicker(idx)}
              inputRef={cardInputRefs.current[idx]}
              onChangeFiles={(e) => {
                const files = e?.target?.files ?? null;
                if (onAddToFolder) {
                  void onAddToFolder(idx, files);
                } else if (onChangeFiles) {
                  void onChangeFiles(idx, e);
                }
              }}
              onChangeCaption={(imageIdx, text) =>
                onChangeCaption?.(idx, imageIdx, text)
              }
            />
          </div>
        );
      })}

      {/* 세로 폴더 */}
      <div className="image-card">
        <ImageCarouselUpload
          items={fileItems}
          maxCount={maxFiles}
          layout="tall"
          tallHeightClass="h-80"
          objectFit="cover"
          captionAsFolderTitle
          folderTitle={verticalFolderTitle ?? ""}
          onChangeFolderTitle={(text) => onChangeVerticalFolderTitle?.(text)}
          onRemoveImage={onRemoveFileItem}
          onOpenPicker={() => fileInputRef.current?.click()}
          inputRef={fileInputRef}
          onChangeFiles={(e) => onAddFiles(e.target.files)}
          onChangeCaption={(index, text) =>
            onChangeFileItemCaption?.(index, text)
          }
        />
      </div>

      {/* 새 폴더 추가 버튼 */}
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
