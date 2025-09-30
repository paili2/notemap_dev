import { FilterSection } from "./FilterSection";
import { DistrictSection } from "./DistrictSection";
import type { MapMenuKey } from "../types/types";
import type { LucideIcon } from "lucide-react";
import { Train, Coffee, Store, Pill, School } from "lucide-react";
import { PoiKind } from "@/features/map/lib/poiOverlays";

interface ExpandedMenuProps {
  active: MapMenuKey;
  activeSubmenu: "filter" | "edit" | null;
  isDistrictOn: boolean;
  onSubmenuClick: (submenu: "filter" | "edit") => void;
  onMenuItemClick: (key: MapMenuKey) => void;
  onToggleDistrict: (next: boolean) => void;
  onToggle: () => void;

  // 주변시설 제어형
  poiKinds: PoiKind[];
  onChangePoiKinds: (next: PoiKind[]) => void;
}

// 학교 포함한 표시 순서
const POI_ORDER: PoiKind[] = [
  "subway",
  "school",
  "convenience",
  "cafe",
  "pharmacy",
];

const POI_ICON: Record<PoiKind, LucideIcon> = {
  subway: Train,
  school: School,
  convenience: Store,
  cafe: Coffee,
  pharmacy: Pill,
};

const POI_LABEL: Record<PoiKind, string> = {
  subway: "지하철",
  school: "학교",
  convenience: "편의점",
  cafe: "카페",
  pharmacy: "약국",
};

export const ExpandedMenu = ({
  active,
  activeSubmenu,
  isDistrictOn,
  onSubmenuClick,
  onMenuItemClick,
  onToggleDistrict,
  onToggle,
  poiKinds,
  onChangePoiKinds,
}: ExpandedMenuProps) => {
  const toggleKind = (k: PoiKind) => {
    const has = poiKinds.includes(k);
    const next = has ? poiKinds.filter((x) => x !== k) : [...poiKinds, k];
    onChangePoiKinds(next);
  };

  return (
    <div className="fixed top-16 right-16 flex flex-col gap-2 p-1 bg-white border border-gray-400 rounded-lg shadow-xl w-56 z-[60]">
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

      {/* 주변시설 */}
      <div className="px-2 pb-2">
        <div className="text-xs font-semibold text-gray-600 mb-2">주변시설</div>
        <div className="grid grid-cols-3 gap-2">
          {POI_ORDER.map((k) => {
            const Icon = POI_ICON[k];
            const isActive = poiKinds.includes(k);
            return (
              <button
                key={k}
                onClick={() => toggleKind(k)}
                className={[
                  "flex flex-col items-center justify-center gap-1 h-16 rounded-lg text-xs border transition",
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                ].join(" ")}
                aria-pressed={isActive}
                title={POI_LABEL[k]}
              >
                <Icon className="w-5 h-5" />
                <span>{POI_LABEL[k]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
