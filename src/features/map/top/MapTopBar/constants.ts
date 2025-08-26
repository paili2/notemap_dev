import type { FilterKey } from "./types";

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "new", label: "신축" },
  { key: "old", label: "구옥" },
  { key: "fav", label: "즐겨찾기" },
];
