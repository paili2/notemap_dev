export const FILTER_KEYS = ["all", "new", "old"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
