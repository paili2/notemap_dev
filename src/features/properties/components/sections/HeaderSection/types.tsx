export interface HeaderSectionProps {
  // 제목
  title: string;
  setTitle: (v: string) => void;

  // 별점(1~5)
  listingStars: number;
  setListingStars: (n: number) => void;

  // 엘리베이터 O/X
  elevator: "O" | "X";
  setElevator: (v: "O" | "X") => void;

  // 닫기
  onClose?: () => void;

  /** placeholder로 보여줄 힌트(선택) — 수정모달에서 기존 제목을 힌트로 쓰고 싶을 때 */
  placeholderHint?: string;

  /** 새로고침 동작 (선택) */
  onRefreshStars?: () => void;
}
