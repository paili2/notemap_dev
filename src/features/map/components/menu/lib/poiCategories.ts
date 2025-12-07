/* ───────── POI 카테고리 정의 ───────── */

import { PoiKind } from "../../../engine/overlays/poiOverlays";
import { PoiCategoryKey } from "../components/ExpandedMenu";

export const POI_CATEGORY_KEYS = [
  "transport",
  "convenience",
  "medical",
  "public",
  "leisure",
] as const;

export const POI_CATEGORY_LABEL: Record<PoiCategoryKey, string> = {
  transport: "교통",
  convenience: "편의",
  medical: "의료",
  public: "공공",
  leisure: "여가",
};

export const POI_CATEGORY_ITEMS: Record<PoiCategoryKey, PoiKind[]> = {
  transport: ["subway", "parking"],
  convenience: ["convenience", "mart"],
  medical: ["pharmacy", "hospital"],
  public: ["school", "safety"],
  leisure: ["cafe", "park", "culture"],
};
