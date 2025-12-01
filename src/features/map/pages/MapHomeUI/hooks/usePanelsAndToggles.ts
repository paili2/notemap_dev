"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Args = {
  useSidebar: boolean;
  setUseSidebar: (next: boolean) => void;
  roadviewVisible: boolean;
  closeRoadview: () => void;
};

export function usePanelsAndToggles({
  useSidebar,
  setUseSidebar,
  roadviewVisible,
  closeRoadview,
}: Args) {
  const [isDistrictOn, setIsDistrictOnState] = useState(false);

  const [rightOpen, setRightOpen] = useState(false);
  const [filterSearchOpen, setFilterSearchOpen] = useState(false);
  const [noResultDialogOpen, setNoResultDialogOpen] = useState(false);

  const [roadviewRoadOn, setRoadviewRoadOn] = useState(false);

  const rightAreaRef = useRef<HTMLDivElement | null>(null);
  const filterAreaRef = useRef<HTMLDivElement | null>(null);
  const sidebarAreaRef = useRef<HTMLDivElement | null>(null);

  // 바깥 클릭 시 패널/사이드바 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rightOpen && !filterSearchOpen && !useSidebar) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      // ✅ 1) 영업자 계약기록 모달 안쪽 클릭이면 무시
      if (target.closest("[data-contract-records-modal-root]")) {
        return;
      }

      // 필터 검색 포털 영역 클릭 시 무시
      const filterPortalRoot = document.getElementById("filter-search-root");
      if (filterPortalRoot && filterPortalRoot.contains(target)) {
        return;
      }

      // ✅ 2) 오른쪽 패널 / 필터 패널 / 사이드바 내부 클릭이면 무시
      if (
        rightAreaRef.current?.contains(target) ||
        filterAreaRef.current?.contains(target) ||
        sidebarAreaRef.current?.contains(target)
      ) {
        return;
      }

      // ✅ 3) 진짜로 바깥을 클릭했을 때만 닫기
      setRightOpen(false);
      setFilterSearchOpen(false);
      setUseSidebar(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [rightOpen, filterSearchOpen, useSidebar, setUseSidebar]);

  const handleSetDistrictOn = useCallback(
    (next: boolean) => {
      setIsDistrictOnState(next);
      if (next && roadviewVisible) {
        closeRoadview();
      }
    },
    [roadviewVisible, closeRoadview]
  );

  const handleSetRightOpen = useCallback(
    (expanded: boolean) => {
      setRightOpen(expanded);
      if (expanded) {
        setFilterSearchOpen(false);
        if (useSidebar) setUseSidebar(false);
      }
    },
    [useSidebar, setUseSidebar]
  );

  const handleOpenFilterSearch = useCallback(() => {
    setFilterSearchOpen(true);
    setRightOpen(false);
    setUseSidebar(false);
  }, [setUseSidebar]);

  const handleToggleSidebar = useCallback(() => {
    const next = !useSidebar;
    setUseSidebar(next);
    if (next) {
      setRightOpen(false);
      setFilterSearchOpen(false);
    }
  }, [useSidebar, setUseSidebar]);

  const toggleRoadviewRoad = useCallback(() => {
    setRoadviewRoadOn((prev) => !prev);
  }, []);

  return {
    // 상태
    isDistrictOn,
    rightOpen,
    filterSearchOpen,
    noResultDialogOpen,
    roadviewRoadOn,
    // setter / 핸들러
    handleSetDistrictOn,
    handleSetRightOpen,
    setFilterSearchOpen,
    setNoResultDialogOpen,
    handleOpenFilterSearch,
    handleToggleSidebar,
    toggleRoadviewRoad,
    // ref
    rightAreaRef,
    filterAreaRef,
    sidebarAreaRef,
  };
}
