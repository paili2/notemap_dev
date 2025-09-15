// constants.ts
import { FILTER_KEYS, type FilterKey } from "./types";

export const FILTER_LABELS: Record<FilterKey, string> = {
  all: "전체",
  new: "신축",
  old: "구옥",
};

// 기존처럼 key/label 배열을 그대로 export (UI에서 map 돌리기 용이)
export const FILTERS: { key: FilterKey; label: string }[] = FILTER_KEYS.map(
  (k) => ({
    key: k,
    label: FILTER_LABELS[k],
  })
);
