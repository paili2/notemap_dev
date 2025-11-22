"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { Train, Coffee, Store, Pill, School } from "lucide-react";

import type { MapMenuKey } from "./types/types";
import { PoiKind, POI_LABEL } from "@/features/map/shared/overlays/poiOverlays";

// top 모듈에 있는 로드뷰 토글 (기존 default export 유지)
import DistrictToggleButton from "../../../components/controls/DistrictToggleButton";
import RoadviewToggleButton from "./RoadviewToggleButton";
import { FilterSection } from "./FilterSection";

interface ExpandedMenuProps {
  active: MapMenuKey;
  activeSubmenu: "filter" | "edit" | null;

  // 지적편집도
  isDistrictOn: boolean;
  onToggleDistrict: () => void;

  // (과거 콜백 호환—현재 이 컴포넌트에서는 사용하지 않음)
  onSubmenuClick: (submenu: "filter" | "edit") => void;
  onMenuItemClick: (key: MapMenuKey) => void;
  onToggle?: () => void;

  // 주변시설
  poiKinds: readonly PoiKind[];
  onChangePoiKinds: (next: PoiKind[]) => void;

  // 로드뷰
  roadviewVisible: boolean;
  onToggleRoadview: () => void;
}

/* ───────── POI 카테고리 정의 ───────── */

const POI_CATEGORY_KEYS = [
  "transport",
  "convenience",
  "medical",
  "public",
  "leisure",
] as const;

type PoiCategoryKey = (typeof POI_CATEGORY_KEYS)[number];

const POI_CATEGORY_LABEL: Record<PoiCategoryKey, string> = {
  transport: "교통",
  convenience: "편의",
  medical: "의료",
  public: "공공",
  leisure: "여가",
};

/**
 * poiOverlays.tsx 에서 PoiKind를 다음처럼 확장했다고 가정:
 *
 *  "subway" | "ktx" | "convenience" | "mart" | "cafe" |
 *  "pharmacy" | "hospital" | "school" | "police" | "fireStation" | "park"
 */
const POI_CATEGORY_ITEMS: Record<PoiCategoryKey, PoiKind[]> = {
  transport: ["subway", "ktx"],
  convenience: ["convenience", "mart"],
  medical: ["pharmacy", "hospital"],
  public: ["school", "police", "fireStation"],
  leisure: ["cafe", "park"],
};

/* ───────── 메뉴용 아이콘 (있는 것만 사용) ───────── */

const POI_MENU_ICON: Partial<Record<PoiKind, LucideIcon>> = {
  subway: Train,
  school: School,
  convenience: Store,
  mart: Store,
  cafe: Coffee,
  pharmacy: Pill,
  hospital: Pill,
};

export const ExpandedMenu: React.FC<ExpandedMenuProps> = React.memo(
  function ExpandedMenu({
    active,
    activeSubmenu,
    isDistrictOn,
    onSubmenuClick,
    onMenuItemClick,
    onToggleDistrict,
    poiKinds,
    onChangePoiKinds,
    roadviewVisible,
    onToggleRoadview,
  }) {
    // ✅ 주변시설 카테고리 탭 상태
    const [activePoiCategory, setActivePoiCategory] =
      React.useState<PoiCategoryKey>("transport");

    // ✅ POI 토글 핸들러
    const toggleKind = React.useCallback(
      (k: PoiKind) => {
        const has = poiKinds.includes(k);
        const next = has ? poiKinds.filter((x) => x !== k) : [...poiKinds, k];
        onChangePoiKinds(next);
      },
      [poiKinds, onChangePoiKinds]
    );

    const currentKinds = POI_CATEGORY_ITEMS[activePoiCategory];

    // ✅ 현재 카테고리에 해당하는 버튼 목록
    const poiButtons = React.useMemo(
      () =>
        currentKinds.map((k) => {
          const Icon = POI_MENU_ICON[k];
          const isActive = poiKinds.includes(k);

          return (
            <button
              key={k}
              type="button"
              onClick={() => toggleKind(k)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-16 rounded-lg text-[11px] border transition",
                isActive
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
              aria-pressed={isActive}
              title={POI_LABEL[k] ?? ""}
            >
              {Icon && <Icon className="w-5 h-5" aria-hidden />}
              <span>{POI_LABEL[k] ?? k}</span>
            </button>
          );
        }),
      [currentKinds, poiKinds, toggleKind]
    );

    // ✅ 카테고리 탭 렌더
    const categoryTabs = React.useMemo(
      () =>
        POI_CATEGORY_KEYS.map((key) => {
          const isActive = activePoiCategory === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActivePoiCategory(key)}
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium border transition",
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              {POI_CATEGORY_LABEL[key]}
            </button>
          );
        }),
      [activePoiCategory]
    );

    return (
      <div
        className={cn(
          "fixed z-[220]",
          "right-4 top-[65px]", // 답사지 패널이랑 세로 위치 맞추기
          "w-[318px] max-w-[calc(100vw-2rem)]", // ⬅️ 가로 폭: 사이드바랑 동일하게
          "rounded-md border border-gray-200 bg-white p-2 shadow-xl",
          "pointer-events-auto"
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        role="region"
        aria-label="지도 도구 및 주변시설"
      >
        <FilterSection
          active={active}
          activeSubmenu={activeSubmenu}
          onSubmenuClick={onSubmenuClick}
          onMenuItemClick={onMenuItemClick}
        />

        {/* 지도 도구 */}
        <div className="px-2 pb-1">
          <div className="mb-2 text-xs font-semibold text-gray-600">
            지도 도구
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DistrictToggleButton
              pressed={isDistrictOn}
              onPress={onToggleDistrict}
              showLabel
            />

            <RoadviewToggleButton
              pressed={roadviewVisible}
              onPress={onToggleRoadview}
              showLabel
            />
          </div>
        </div>

        {/* 주변시설 */}
        <div className="px-2 pb-2">
          <div className="mb-2 text-xs font-semibold text-gray-600">
            주변시설
          </div>

          {/* 카테고리 탭 */}
          <div className="mb-2 flex flex-wrap gap-1">{categoryTabs}</div>

          {/* 현재 카테고리의 POI 토글들 */}
          <div className="grid grid-cols-3 gap-2">{poiButtons}</div>
        </div>
      </div>
    );
  }
);
