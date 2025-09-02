export type FilterKey = "all" | "new" | "old" | "fav";

export type MapTopBarProps = {
  className?: string;
  active?: FilterKey;
  onChangeFilter?: (k: FilterKey) => void;

  value?: string; // 검색어 (controlled)
  defaultValue?: string; // 검색어 초기값 (uncontrolled)
  onChangeSearch?: (v: string) => void;
  onSubmitSearch?: (v: string) => void;
  placeholder?: string;
};
