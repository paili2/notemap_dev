import { PoiKind } from "@/features/map/lib/poiOverlays";

export type MapMenuKey = "all" | "new" | "old";

export interface MapMenuProps {
  active: MapMenuKey;
  onChange?: (key: MapMenuKey) => void;
  isDistrictOn: boolean;
  onToggleDistrict: (next: boolean) => void;
  className?: string;
  poiKinds: PoiKind[];
  onChangePoiKinds: (next: PoiKind[]) => void;
  roadviewVisible: boolean;
  onToggleRoadview: () => void;

  // ✅ 컨트롤드 모드용
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}
