"use client";

import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import type { ToggleSidebarProps } from "./types/sidebar";
import { useSidebarState } from "./hooks/useSidebarState";
import { SidebarSection } from "./components/SidebarSection";
import { ContractRecordsButton } from "./components/ContractRecordsButton";

export function Sidebar({ isSidebarOn, onToggleSidebar }: ToggleSidebarProps) {
  const {
    nestedFavorites,
    setNestedFavorites,
    explorations,
    setExplorations,
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,
    handleDeleteExploration,
    handleContractRecordsClick,
  } = useSidebarState();

  // 사이드바가 닫혀있으면 아무것도 렌더링하지 않음
  if (!isSidebarOn) {
    return null;
  }

  return (
    <div className="fixed top-[380px] right-4 transform -translate-y-1/2 z-50 w-80 bg-white border border-gray-400 rounded-lg shadow-xl overflow-hidden">
      <style jsx>{`
        .scrollbar-no-arrows::-webkit-scrollbar-button {
          display: none;
        }
      `}</style>

      <div className="flex flex-col gap-2 p-2 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-white scrollbar-thumb-black hover:scrollbar-thumb-gray-800 scrollbar-no-arrows">
        <SidebarSection
          title="답사"
          items={explorations}
          onItemsChange={setExplorations}
          onDeleteItem={handleDeleteExploration}
        />

        {/* 즐겨찾기 섹션을 위로 이동 */}
        <SidebarSection
          title="즐겨찾기"
          items={[]}
          nestedItems={nestedFavorites}
          onItemsChange={() => {}}
          onDeleteItem={() => {}}
          onNestedItemsChange={setNestedFavorites}
          onDeleteNestedItem={handleDeleteNestedFavorite}
          onDeleteSubItem={handleDeleteSubFavorite}
        />

        <ContractRecordsButton onClick={handleContractRecordsClick} />
      </div>
    </div>
  );
}
