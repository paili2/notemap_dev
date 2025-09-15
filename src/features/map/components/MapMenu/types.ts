export type MapMenuKey = "all" | "new" | "old";

export interface MapMenuProps {
  active: MapMenuKey;
  onChange?: (key: MapMenuKey) => void;
  isDistrictOn: boolean;
  onToggleDistrict: (next: boolean) => void;
  className?: string;
}
