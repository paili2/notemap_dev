export const FILTER_KEYS = ["all", "new", "old", "fav"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export type MapTopBarProps = {
  className?: string;
  active?: FilterKey;
  onChangeFilter?: (k: FilterKey) => void;

  value?: string; // 검색어 (controlled)
  defaultValue?: string; // 검색어 초기값 (uncontrolled)
  onChangeSearch?: (v: string) => void;
  onSubmitSearch?: (v: string) => void;
  onClearSearch?: () => void; // X 클릭 시 상위로 콜백
  placeholder?: string;

  wrapOnMobile?: boolean;
};
