"use client";

import { useMemo, useCallback } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import type { ToggleSidebarProps } from "./types/sidebar";
import type { ListItem } from "./types/sidebar";
import { useSidebar } from "./SideBarProvider";
import { SidebarSection } from "./components/SidebarSection";
import { ContractRecordsButton } from "./components/ContractRecordsButton";
import { AdminButton } from "./components/AdminButton";

import { useScheduledReservations } from "../survey-reservations/hooks/useScheduledReservations";
import { useReorderReservations } from "../survey-reservations/hooks/useReorderReservations";
import type { MyReservation } from "@/shared/api/surveyReservations";

export function Sidebar({ isSidebarOn }: ToggleSidebarProps) {
  const {
    nestedFavorites,
    setNestedFavorites,
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,
    handleDeleteSiteReservation,
    handleContractRecordsClick,
  } = useSidebar();

  // ✅ 예약 목록 훅 (서버 sortOrder 반영 + refetch 제공)
  const { items, setItems, refetch } = useScheduledReservations();

  // ✅ 드래그 종료 시 서버에 일괄 재정렬 PATCH
  const { onReorder } = useReorderReservations({
    items,
    setItems,
    onSuccess: () => refetch(), // 서버 반영 후 새로고침
  });

  if (!isSidebarOn) return null;

  /* ────────────────────────────────────────────────
   * ① MyReservation[] → ListItem[] (SidebarSection 기대 타입)
   *    - title / dateISO 필드를 채워줌
   * ──────────────────────────────────────────────── */
  const listItems: ListItem[] = useMemo(
    () =>
      (items ?? []).map((r) => ({
        id: r.id,
        title: r.addressLine ?? (r.posKey ? `좌표 ${r.posKey}` : "주소 미확인"),
        dateISO: r.reservedDate ?? "",
      })),
    [items]
  );

  /* ────────────────────────────────────────────────
   * ② SidebarSection onItemsChange(ListItem[]) → setItems(MyReservation[])
   *    - D&D 중간 이동 등 로컬 변화를 MyReservation 배열로 역어댑트
   *    - 0..N sortOrder 재부여 (UI 안정)
   * ──────────────────────────────────────────────── */
  const handleListItemsChange = useCallback(
    (nextList: ListItem[]) => {
      const orderedIds = nextList.map((li) => String(li.id));
      setItems((prev: MyReservation[]) => {
        const map = new Map(prev.map((p) => [String(p.id), p]));
        const next: MyReservation[] = [];
        // 1) 드롭으로 확정된 id 순서대로 재배치
        for (const id of orderedIds) {
          const found = map.get(id);
          if (found) next.push({ ...found });
        }
        // 2) 혹시 누락된 항목은 뒤에 유지
        for (const p of prev) {
          if (!orderedIds.includes(String(p.id))) next.push({ ...p });
        }
        // 3) 0..N sortOrder 재부여
        next.forEach((r, i) => (r.sortOrder = i));
        return next;
      });
    },
    [setItems]
  );

  return (
    <div className="fixed top-16 right-4 z-50 w-80 bg-white border border-gray-400 rounded-lg shadow-xl overflow-hidden">
      <style jsx>{`
        .scrollbar-no-arrows::-webkit-scrollbar-button {
          display: none;
        }
      `}</style>

      <div className="flex flex-col gap-2 p-1 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-white scrollbar-thumb-black hover:scrollbar-thumb-gray-800 scrollbar-no-arrows">
        {/* ✅ 답사지 예약 섹션 */}
        <SidebarSection
          title="답사지 예약"
          items={listItems} // 어댑트된 ListItem[]
          onItemsChange={handleListItemsChange} // 역어댑트 + sortOrder 재부여
          onDeleteItem={handleDeleteSiteReservation} // 기존 삭제 핸들러 유지(id 사용)
          onReorderIds={(ids) => onReorder(ids)} // 드롭 종료 → 서버 재정렬 PATCH
        />

        {/* 즐겨찾기 */}
        <SidebarSection
          title="즐겨찾기"
          items={[]} // 평면 리스트 없음
          nestedItems={nestedFavorites}
          onItemsChange={() => {}}
          onDeleteItem={() => {}}
          onNestedItemsChange={setNestedFavorites}
          onDeleteNestedItem={handleDeleteNestedFavorite}
          onDeleteSubItem={handleDeleteSubFavorite}
        />

        <ContractRecordsButton onClick={handleContractRecordsClick} />
        <AdminButton />

        {/* 계정 정보 및 로그아웃 */}
        <div className="flex justify-between items-center p-2 border-t border-gray-200">
          <span className="text-base font-medium text-gray-700">
            사용자 계정
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
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
