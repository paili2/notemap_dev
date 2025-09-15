"use client";

import { FolderPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import ImageCarouselUpload from "@/components/organisms/ImageCarouselUpload/ImageCarouselUpload";
import { ImageItem, ResolvedFileItem } from "@/features/properties/types/media";
import { useRef } from "react";

// 🔧 ImageFile은 ImageItem alias로 유지 (가로 카드용)
export type ImageFile = ImageItem;

type Props = {
  /** 폴더별 이미지(파일명 포함) — 가로 카드 */
  imagesByCard: ImageItem[][];
  onOpenPicker: (idx: number) => void;
  onChangeFiles: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  registerInputRef: (idx: number, el: HTMLInputElement | null) => void;
  onAddPhotoFolder: () => void;
  /** ⬇️ 추가: 폴더(카드) 삭제 */
  onRemovePhotoFolder?: (
    folderIdx: number,
    opts?: { keepAtLeastOne?: boolean }
  ) => void;
  maxPerCard: number;

  /** 캡션 변경 */
  onChangeCaption?: (cardIdx: number, imageIdx: number, text: string) => void;

  /** 가로형(폴더 내부) 이미지 삭제 */
  onRemoveImage?: (cardIdx: number, imageIdx: number) => void;

  /** 세로 카드(파일들) — ✅ url이 확정된 타입만 받음 */
  fileItems: ResolvedFileItem[];
  /** 세로 카드 업로드 */
  onAddFiles: (files: FileList | null) => void;
  onChangeFileItemCaption?: (index: number, text: string) => void;
  onRemoveFileItem?: (index: number) => void;

  maxFiles: number;
};

export default function ImagesSection({
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
}: Props) {
  const list = imagesByCard?.length ? imagesByCard : [[]];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="flex flex-col gap-3">
      {/* 가로형 이미지 카드들 */}
      {list.map((files, idx) => (
        <div key={idx} className="rounded-xl border p-3">
          {/* 카드 헤더: 제목 + 폴더 삭제 버튼 */}
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-medium">사진 폴더 {idx + 1}</h4>
            <div className="flex items-center gap-2">
              {idx > 0 && ( // ✅ 첫 번째 폴더는 삭제 버튼 숨김
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
            /** ⬇️ 우상단 X 버튼 → 부모로 삭제 이벤트 전달 */
            onRemoveImage={(imageIdx) => onRemoveImage?.(idx, imageIdx)}
            onOpenPicker={() => onOpenPicker(idx)}
            registerInputRef={(el) => registerInputRef(idx, el)}
            onChangeFiles={(e) => onChangeFiles(idx, e)}
          />
        </div>
      ))}

      {/* 세로형(파일) 카드 — ✅ ResolvedFileItem[] */}
      <ImageCarouselUpload
        items={fileItems}
        maxCount={maxFiles}
        layout="tall"
        tallHeightClass="h-80"
        objectFit="cover"
        onChangeCaption={(i, text) => onChangeFileItemCaption?.(i, text)}
        /** ⬇️ 우상단 X 버튼 → 부모로 삭제 이벤트 전달 */
        onRemoveImage={(i) => onRemoveFileItem?.(i)}
        onOpenPicker={() => fileInputRef.current?.click()}
        registerInputRef={(el) => (fileInputRef.current = el)}
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
