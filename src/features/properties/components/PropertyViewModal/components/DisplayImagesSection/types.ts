// src/features/properties/components/PropertyViewModal/components/DisplayImagesSection/types.ts
import type { ImageItem } from "@/features/properties/types/media";

export type AnyImg =
  | ImageItem
  | {
      url?: string | null;
      dataUrl?: string | null;
      idbKey?: string | null;
      signedUrl?: string | null;
      publicUrl?: string | null;
      name?: string | null;
      caption?: string | null;
      [k: string]: any;
    }
  | string
  | null
  | undefined;

/** 제목이 붙을 수 있는 이미지 그룹 */
export type ImagesGroup = {
  title?: string | null;
  images?: AnyImg[]; // 렌더 쪽에서 최대 20장 제한
};

export interface DisplayImagesSectionProps {
  /** 가로 카드: 과거 AnyImg[][] 또는 {title, images}[] 모두 허용 */
  cards?: AnyImg[][] | ImagesGroup[];

  /** 레거시 평면 이미지(폴백용) */
  images?: AnyImg[];

  /** 세로 카드: 단일 배열 | 배열의 배열 | 그룹 배열 모두 허용 */
  files?: AnyImg[] | AnyImg[][] | ImagesGroup[];

  /** 파일명 오버레이 표시 여부 */
  showNames?: boolean;
}
