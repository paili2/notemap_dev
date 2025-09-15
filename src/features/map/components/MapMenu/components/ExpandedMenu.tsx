import { FilterSection } from "./FilterSection";
import { DistrictSection } from "./DistrictSection";
import type { MapMenuKey } from "../types/types";

interface ExpandedMenuProps {
  active: MapMenuKey;
  activeSubmenu: "filter" | "edit" | null;
  isDistrictOn: boolean;
  onSubmenuClick: (submenu: "filter" | "edit") => void;
  onMenuItemClick: (key: MapMenuKey) => void;
  onToggleDistrict: (next: boolean) => void;
  onToggle: () => void;
}

export const ExpandedMenu = ({
  active,
  activeSubmenu,
  isDistrictOn,
  onSubmenuClick,
  onMenuItemClick,
  onToggleDistrict,
  onToggle,
}: ExpandedMenuProps) => {
  return (
    <div className="fixed top-16 right-16 flex flex-col gap-2 p-1 bg-white border border-gray-400 rounded-lg shadow-xl w-48 z-[60]">
      <FilterSection
        active={active}
        activeSubmenu={activeSubmenu}
        onSubmenuClick={onSubmenuClick}
        onMenuItemClick={onMenuItemClick}
      />
      <DistrictSection
        isDistrictOn={isDistrictOn}
        onToggleDistrict={onToggleDistrict}
        onToggle={onToggle}
      />
    </div>
  );
};
