"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { Train, Coffee, Store, Pill, School } from "lucide-react";

import type { MapMenuKey } from "./types/types";
import { PoiKind } from "@/features/map/shared/overlays/poiOverlays";

// top 모듈에 있는 로드뷰 토글 (기존 default export 유지)
import DistrictToggleButton from "../../../components/controls/DistrictToggleButton";
import RoadviewToggleButton from "./RoadviewToggleButton";
import { FilterSection } from "./FilterSection";

interface ExpandedMenuProps {
  active: MapMenuKey;
  activeSubmenu: "filter" | "edit" | null;

  // 지적편집도
  isDistrictOn: boolean;
  onToggleDistrict: (next: boolean) => void;

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

/** 학교 포함 표시 순서 (컴포넌트 외부 상수로 고정) */
const POI_ORDER: readonly PoiKind[] = [
  "subway",
  "school",
  "convenience",
  "cafe",
  "pharmacy",
] as const;

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

export const ExpandedMenu: React.FC<ExpandedMenuProps> = React.memo(
  function ExpandedMenu({
    active,
    activeSubmenu,
    isDistrictOn,
    onSubmenuClick,
    onMenuItemClick,
    onToggleDistrict,
    // onToggle (사용 안함—호환 유지)
    poiKinds,
    onChangePoiKinds,
    roadviewVisible,
    onToggleRoadview,
  }) {
    // 주변시설 토글 핸들러 메모이제이션
    const toggleKind = React.useCallback(
      (k: PoiKind) => {
        const has = poiKinds.includes(k);
        const next = has ? poiKinds.filter((x) => x !== k) : [...poiKinds, k];
        onChangePoiKinds(next);
      },
      [poiKinds, onChangePoiKinds]
    );

    // 렌더될 POI 버튼 목록 메모이제이션
    const poiButtons = React.useMemo(
      () =>
        POI_ORDER.map((k) => {
          const Icon = POI_ICON[k];
          const isActive = poiKinds.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggleKind(k)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-16 rounded-lg text-xs border transition",
                isActive
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
              aria-pressed={isActive}
              title={POI_LABEL[k]}
            >
              <Icon className="w-5 h-5" aria-hidden />
              <span>{POI_LABEL[k]}</span>
            </button>
          );
        }),
      [poiKinds, toggleKind]
    );

    return (
      <div
        className="fixed top-16 right-16 z-[20] w-56 rounded-lg border border-gray-400 bg-white p-1 shadow-xl pointer-events-auto"
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
              onPress={() => onToggleDistrict(!isDistrictOn)}
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
          <div className="grid grid-cols-3 gap-2">{poiButtons}</div>
        </div>
      </div>
    );
  }
);
