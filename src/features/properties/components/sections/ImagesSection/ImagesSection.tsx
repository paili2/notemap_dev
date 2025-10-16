"use client";

import { FolderPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import ImageCarouselUpload from "@/components/organisms/ImageCarouselUpload/ImageCarouselUpload";
import { ImageItem, ResolvedFileItem } from "@/features/properties/types/media";
import React, { useEffect, useMemo, useRef } from "react";

export type ImageFile = ImageItem;

type Props = {
  imagesByCard: ImageItem[][];
  onOpenPicker: (idx: number) => void;
  onChangeFiles: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;

  /** (선택) 상위로 input 엘리먼트를 알려주고 싶다면 — 반드시 useCallback 으로 안정화해서 넘기세요 */
  registerInputRef?: (idx: number, el: HTMLInputElement | null) => void;

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
};

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

  /** ✅ 카드별 파일 input을 위한 객체 ref 배열 (인스턴스 유지) */
  const cardInputRefs = useRef<Array<React.RefObject<HTMLInputElement>>>([]);
  if (cardInputRefs.current.length !== list.length) {
    cardInputRefs.current = Array.from(
      { length: list.length },
      (_, i) => cardInputRefs.current[i] ?? React.createRef<HTMLInputElement>()
    );
  }

  /** ✅ 이전에 부모에게 전달했던 노드 스냅샷 */
  const prevNodesRef = useRef<Array<HTMLInputElement | null>>([]);

  /** ✅ ‘노드가 바뀐 경우에만’ 부모에게 통지 (루프 차단) */
  useEffect(() => {
    if (!registerInputRef) return;

    const nextNodes = cardInputRefs.current.map((r) => r.current ?? null);
    const prevNodes = prevNodesRef.current;

    // 변경된 인덱스만 통지
    for (let i = 0; i < nextNodes.length; i++) {
      if (prevNodes[i] !== nextNodes[i]) {
        registerInputRef(i, nextNodes[i]);
      }
    }
    prevNodesRef.current = nextNodes;
    // ⚠️ 의존성에서 registerInputRef를 제외해 루프 고리 제거
  }, [list.length]); // 카드 수 변동시에만 재평가

  /** 세로 업로드용 단일 input */
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
              onChangeCaption?.(idx, imageIdx, text)
            }
            onRemoveImage={(imageIdx) => onRemoveImage?.(idx, imageIdx)}
            onOpenPicker={() => onOpenPicker(idx)}
            /** ✅ 콜백 ref 금지, 객체 ref 전달 */
            inputRef={cardInputRefs.current[idx]}
            onChangeFiles={(e) => onChangeFiles(idx, e)}
          />
        </div>
      ))}

      {/* 세로형(파일) 카드 */}
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
