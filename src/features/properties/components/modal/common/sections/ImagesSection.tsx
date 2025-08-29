"use client";

import { FolderPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import ImageCarouselUpload from "../ImageCarouselUpload";
import { ImageItem } from "@/features/properties/types/media";
import { useRef } from "react";

// 🔧 ImageFile을 ImageItem alias로 통일해서 타입 일관성 확보
export type ImageFile = ImageItem;
type FileItem = { name: string; url: string; caption?: string };

type Props = {
  // 폴더별 이미지(파일명 포함)
  imagesByCard: ImageItem[][]; // ⬅️ ImageItem으로 통일
  onOpenPicker: (idx: number) => void;
  onChangeFiles: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  registerInputRef: (idx: number, el: HTMLInputElement | null) => void;
  onAddPhotoFolder: () => void;
  maxPerCard: number;

  // 캡션 변경
  onChangeCaption?: (cardIdx: number, imageIdx: number, text: string) => void;

  // 세로 카드(파일들)
  fileItems: FileItem[];
  onAddFiles: (files: FileList | null) => void;
  onChangeFileItemCaption?: (index: number, text: string) => void;
  maxFiles: number;
};

export default function ImagesSection({
  imagesByCard,
  onOpenPicker,
  onChangeFiles,
  registerInputRef,
  onAddPhotoFolder,
  maxPerCard,
  onChangeCaption,
  fileItems,
  onAddFiles,
  onChangeFileItemCaption,
  maxFiles,
}: Props) {
  const list = imagesByCard?.length ? imagesByCard : [[], []];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="flex flex-col gap-3">
      {/* 가로형 이미지 카드들 */}
      {list.map((files, idx) => (
        <ImageCarouselUpload
          key={idx}
          items={files}
          maxCount={maxPerCard}
          layout="wide"
          wideAspectClass="aspect-video"
          objectFit="cover"
          onChangeCaption={(imageIdx, text) =>
            onChangeCaption?.(idx, imageIdx, text)
          }
          onOpenPicker={() => onOpenPicker(idx)}
          registerInputRef={(el) => registerInputRef(idx, el)}
          onChangeFiles={(e) => onChangeFiles(idx, e)}
        />
      ))}

      {/* 세로형(파일) 카드 */}
      <ImageCarouselUpload
        items={fileItems}
        maxCount={maxFiles}
        layout="tall"
        tallHeightClass="h-80"
        objectFit="cover" // ✅ 가로 카드와 동일하게 꽉 채워 보이도록
        onChangeCaption={(i, text) => onChangeFileItemCaption?.(i, text)}
        onOpenPicker={() => fileInputRef.current?.click()}
        registerInputRef={(el) => (fileInputRef.current = el)}
        onChangeFiles={(e) => onAddFiles(e.target.files)}
      />

      {/* 사진 폴더 추가 버튼 */}
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
