import { ImageItem } from "@/features/properties/types/media";

export interface ImageCarouselUploadProps {
  items: ImageItem[];
  onChangeCaption?: (index: number, text: string) => void;
  onRemoveImage?: (index: number) => void;

  useLocalCaptionFallback?: boolean;
  onOpenPicker?: () => void;

  /** ✅ 콜백 ref 제거, 객체 ref만 허용 */
  inputRef?: React.RefObject<HTMLInputElement> | null;

  onChangeFiles?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxCount?: number;
  layout?: "wide" | "tall";
  wideAspectClass?: string;
  tallHeightClass?: string;
  objectFit?: "cover" | "contain";
}
