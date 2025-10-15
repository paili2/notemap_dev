"use client";

import * as React from "react";
import { Map } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/cn";
import { ExpandedMenu } from "./components/ExpandedMenu";
import type { MapMenuKey, MapMenuProps } from "./types/types";
import { useMapMenuState, type MapMenuSubmenu } from "./hooks/useMapMenuState";

export default function MapMenu(props: MapMenuProps) {
  const {
    active,
    onChange,
    isDistrictOn,
    onToggleDistrict,
    className,
    poiKinds,
    onChangePoiKinds,
    roadviewVisible,
    onToggleRoadview,
    expanded,
    onExpandChange,
  } = props;

  // 컨트롤드 여부 판별
  const isControlled = typeof expanded === "boolean" && !!onExpandChange;

  // 언컨트롤드 모드용 로컬 상태 훅
  const {
    isExpanded: localExpanded,
    activeSubmenu,
    open,
    close,
    toggle,
    handleSubmenuClick,
  } = useMapMenuState();

  // 실제 사용될 열림 상태/제어 API
  const isExpanded = isControlled ? (expanded as boolean) : localExpanded;

  const api = React.useMemo(
    () => ({
      open: () => (isControlled ? onExpandChange!(true) : open()),
      close: () => (isControlled ? onExpandChange!(false) : close()),
      toggle: () => (isControlled ? onExpandChange!(!isExpanded) : toggle()),
    }),
    [isControlled, onExpandChange, isExpanded, open, close, toggle]
  );

  const onKeyDownToggle = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        api.toggle();
      }
    },
    [api]
  );

  const handleMenuItemClick = React.useCallback(
    (key: MapMenuKey) => {
      onChange?.(key);
      api.close(); // 항목 누르면 닫기
    },
    [onChange, api]
  );

  const handleSubmenu = React.useCallback(
    (submenu: MapMenuSubmenu) => {
      // 컨트롤드 모드에서도 서브메뉴는 내부 훅으로 관리(외부 노출 필요 없으면 이게 가장 단순)
      handleSubmenuClick(submenu);
    },
    [handleSubmenuClick]
  );

  return (
    <div className={cn("relative z-[210]", className)}>
      <Button
        type="button"
        variant={isExpanded ? "default" : "outline"}
        size="icon"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          api.toggle();
        }}
        onKeyDown={onKeyDownToggle}
        className={cn(
          "h-10 w-10 rounded-xl",
          "hover:opacity-100 hover:bg-opacity-100",
          isExpanded ? "shadow-md" : "shadow-sm"
        )}
        aria-label="맵 메뉴 열기"
        aria-pressed={isExpanded}
        aria-expanded={isExpanded}
        data-state={isExpanded ? "on" : "off"}
      >
        <Map className="h-4 w-4" aria-hidden />
      </Button>

      {isExpanded && (
        <ExpandedMenu
          active={active}
          activeSubmenu={activeSubmenu}
          onSubmenuClick={handleSubmenu}
          onMenuItemClick={handleMenuItemClick}
          isDistrictOn={isDistrictOn}
          onToggleDistrict={onToggleDistrict}
          onToggle={api.close}
          poiKinds={poiKinds}
          onChangePoiKinds={onChangePoiKinds}
          roadviewVisible={roadviewVisible}
          onToggleRoadview={onToggleRoadview}
        />
      )}
    </div>
  );
}
