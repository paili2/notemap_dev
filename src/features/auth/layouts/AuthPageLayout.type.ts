export type AuthPageLayoutProps = {
  // 좌측
  logo?: React.ReactNode;
  sideImageUrl?: string;
  sideOverlay?: React.ReactNode;
  leftWidthPx?: number; // 데스크톱 고정폭(px), 기본 560

  // 우측(카드 모드에서만 사용)
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  social?: React.ReactNode;
  footer?: React.ReactNode;

  // 공통
  children: React.ReactNode;
  className?: string;
  rightClassName?: string;
  cardClassName?: string;

  /** 우측을 카드로 감쌀지 선택 (기본: card) */
  frame?: "card" | "none";
};
