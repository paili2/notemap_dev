export type TopRightButtonsProps = {
  onOpenKN: () => void;
  onOpenFavorites: () => void;
  favoritesCount?: number;
  /** 상단에서 얼마나 내릴지(px). 상단 검색바와 겹치면 늘리세요. */
  mapTypeOffsetTop?: number;
};
