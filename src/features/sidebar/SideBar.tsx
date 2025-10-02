"use client";

import { X, LogOut } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import type { ToggleSidebarProps } from "./types/sidebar";
import { useSidebar } from "./SideBarProvider";
import { SidebarSection } from "./components/SidebarSection";
import { ContractRecordsButton } from "./components/ContractRecordsButton";
import { AdminButton } from "./components/AdminButton";

export function Sidebar({ isSidebarOn, onToggleSidebar }: ToggleSidebarProps) {
  const {
    nestedFavorites,
    setNestedFavorites,
    siteReservations,
    setSiteReservations,
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,
    handleDeleteSiteReservation,
    handleContractRecordsClick,
  } = useSidebar();

  // 사이드바가 닫혀있으면 아무것도 렌더링하지 않음
  if (!isSidebarOn) {
    return null;
  }

  return (
    <div className="fixed top-16 right-4 z-50 w-80 bg-white border border-gray-400 rounded-lg shadow-xl overflow-hidden">
      <style jsx>{`
        .scrollbar-no-arrows::-webkit-scrollbar-button {
          display: none;
        }
      `}</style>

      <div className="flex flex-col gap-2 p-1 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-white scrollbar-thumb-black hover:scrollbar-thumb-gray-800 scrollbar-no-arrows">
        <SidebarSection
          title="답사지 예약"
          items={siteReservations}
          onItemsChange={setSiteReservations}
          onDeleteItem={handleDeleteSiteReservation}
        />

        {/* 즐겨찾기 */}
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
        <AdminButton />
        {/* 계정 정보 및 로그아웃 버튼 */}
        <div className="flex justify-between items-center p-2 border-t border-gray-200">
          <span className="text-base font-medium text-gray-700">
            사용자 계정
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // 로그아웃 로직 추가
              console.log("로그아웃");
            }}
            className="p-0"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
