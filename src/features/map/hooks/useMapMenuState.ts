"use client";

import { useState, useCallback } from "react";
import { MapMenuSubmenu } from "../components/menu/types/mapMenu.types";

const DEFAULT_SUBMENU: MapMenuSubmenu = "filter";

/**
 * 지도 메뉴 (MapMenu) 열림/서브메뉴 상태를 관리하는 훅
 */
export function useMapMenuState() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<MapMenuSubmenu | null>(
    DEFAULT_SUBMENU
  );

  /** 메뉴 열기 */
  const open = useCallback(() => {
    setIsExpanded(true);
    setActiveSubmenu(DEFAULT_SUBMENU);
  }, []);

  /** 메뉴 닫기 */
  const close = useCallback(() => {
    setIsExpanded(false);
    setActiveSubmenu(DEFAULT_SUBMENU);
  }, []);

  /** 열림/닫힘 토글 */
  const toggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (next) setActiveSubmenu(DEFAULT_SUBMENU);
      return next;
    });
  }, []);

  /** 서브메뉴 클릭 핸들러 */
  const handleSubmenuClick = useCallback((submenu: MapMenuSubmenu) => {
    setActiveSubmenu((cur) => (cur === submenu ? null : submenu));
  }, []);

  return {
    isExpanded,
    activeSubmenu,
    open,
    close,
    toggle,
    handleSubmenuClick,
  };
}
