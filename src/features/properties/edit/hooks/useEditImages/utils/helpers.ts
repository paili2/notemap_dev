import type { AnyImageRef, ImageItem } from "@/features/properties/types/media";

/* 빈 카드 제거 */
export const dropEmptyCards = (cards: ImageItem[][]) =>
  (cards ?? []).filter(
    (card) => Array.isArray(card) && card.some((it) => !!(it as any)?.url)
  );
