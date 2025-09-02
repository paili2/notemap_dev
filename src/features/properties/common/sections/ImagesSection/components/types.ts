import { ImageItem } from "@/features/properties/types/media";

export interface ImageCarouselUploadProps {
  items: ImageItem[];
  onChangeCaption?: (index: number, text: string) => void;
  /** 현재 슬라이드 삭제 콜백 (우상단 X 버튼) */
  onRemoveImage?: (index: number) => void;

  useLocalCaptionFallback?: boolean;
  onOpenPicker?: () => void;
  registerInputRef?: (el: HTMLInputElement | null) => void;
  onChangeFiles?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxCount?: number;
  layout?: "wide" | "tall";
  wideAspectClass?: string;
  tallHeightClass?: string;
  objectFit?: "cover" | "contain";
}
