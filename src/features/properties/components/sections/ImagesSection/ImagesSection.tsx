// src/features/properties/components/sections/ImagesSection/ImagesSection.tsx
"use client";

import { createRef, useEffect, useRef } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import ImageCarouselUpload from "@/components/organisms/ImageCarouselUpload/ImageCarouselUpload";
import { ImageItem, ResolvedFileItem } from "@/features/properties/types/media";
import { updatePhotos, deletePhotos } from "@/shared/api/photos";

export type PhotoFolder = {
  id: string;
  title: string;
  items: ImageItem[];
};

type RegisterRef =
  | ((idx: number) => (el: HTMLInputElement | null) => void)
  | ((idx: number, el: HTMLInputElement | null) => void);

type Props = {
  folders: PhotoFolder[];
  onChangeFolderTitle?: (folderIdx: number, nextTitle: string) => void;
  onOpenPicker: (folderIdx: number) => void;
  onAddToFolder?: (folderIdx: number, files: FileList | null) => void;
  onChangeFiles?: (
    folderIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  registerInputRef?: RegisterRef;
  onAddFolder: () => void;
  onRemoveFolder?: (
    folderIdx: number,
    opts?: { keepAtLeastOne?: boolean }
  ) => void;
  maxPerCard: number;
  onChangeCaption?: (folderIdx: number, imageIdx: number, text: string) => void;
  onRemoveImage?: (folderIdx: number, imageIdx: number) => void;
  fileItems: ResolvedFileItem[];
  onAddFiles: (files: FileList | null) => void;
  onChangeFileItemCaption?: (index: number, text: string) => void;
  onRemoveFileItem?: (index: number) => void;
  maxFiles: number;
  syncServer?: boolean;
};

const getPhotoId = (item: ImageItem) =>
  (item as any).id as number | string | undefined;

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
  onChangeFileItemCaption,
  onRemoveFileItem,
  maxFiles,
  syncServer = true,
}: Props) {
  const hasFolders = Array.isArray(folders) && folders.length > 0;

  useEffect(() => {
    if (!hasFolders) onAddFolder?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFolders]);

  const renderFolders: PhotoFolder[] = hasFolders
    ? folders
    : [{ id: "__placeholder__", title: "", items: [] }];

  const handleCaptionChange = (
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
    onRemoveImage?.(folderIdx, imageIdx);
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
    <section
      className="relative z-0 isolate flex flex-col gap-3"
      data-images-root
    >
      {renderFolders.map((folder, idx) => {
        const fallbackLabel = `사진 폴더 ${idx + 1}`;
        // ✅ 입력칸에 줄 값: 실제 제목이 없거나 기본문구와 동일하면 빈 문자열로!
        const titleForInput =
          !folder.title || /^사진 폴더\s*\d+$/i.test(folder.title.trim())
            ? ""
            : folder.title;

        return (
          <div
            key={folder.id ?? idx}
            className="image-card rounded-xl border p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-700">
                {folder.title?.trim() || fallbackLabel}
              </div>
              {idx > 0 && hasFolders && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  aria-label={`사진 폴더 ${idx + 1} 삭제`}
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
              /* 사진별 캡션 대신 폴더 제목 1개만 입력 */
              captionAsFolderTitle
              folderTitle={titleForInput}
              onChangeFolderTitle={(text) => onChangeFolderTitle?.(idx, text)}
              /* 이미지 삭제/추가 */
              onRemoveImage={(imageIdx) => handleRemove(idx, imageIdx)}
              onOpenPicker={() => onOpenPicker(idx)}
              inputRef={cardInputRefs.current[idx]}
              onChangeFiles={(e) => {
                const files = e?.target?.files ?? null;
                if (onAddToFolder) onAddToFolder(idx, files);
                else if (onChangeFiles) onChangeFiles(idx, e);
              }}
              // 필요 시 사용
              // onReorder={(from, to) => handleReorder(idx, from, to)}
              // onSetCover={(imageIdx) => handleSetCover(idx, imageIdx)}
            />
          </div>
        );
      })}

      <div className="image-card">
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
      </div>

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
