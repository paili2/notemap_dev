import type { ImageItem } from "@/features/properties/types/media";

/**
 * url 이 있는 이미지가 하나도 없는 카드 제거
 */
export const dropEmptyCards = (cards: ImageItem[][]) =>
  (cards ?? []).filter(
    (card) => Array.isArray(card) && card.some((it) => !!(it as any)?.url)
  );
