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
import { useCancelReservation } from "../survey-reservations/hooks/useCancelReservation";

export function Sidebar({ isSidebarOn }: ToggleSidebarProps) {
  // 0) 안전 기본값 먼저 확정
  const {
    nestedFavorites = [],
    favoritesLoading,
    setNestedFavorites,
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,
    // handleDeleteSiteReservation, // ❌ 예약취소 훅으로 대체
    handleContractRecordsClick,
  } = useSidebar();

  // 1) 모든 훅은 무조건 호출(조건문/반복문 밖)
  const { items, setItems, refetch } = useScheduledReservations();

  const { onReorder } = useReorderReservations({
    items: items ?? [], // ✅ 내부 분기 최소화
    setItems,
    onSuccess: () => refetch(),
  });

  // ✅ 예약 취소 훅(옵티미스틱 삭제 + 실패 롤백 + 성공 후 refetch)
  const { onCancel } = useCancelReservation(items ?? [], setItems, () =>
    refetch()
  );

  // 2) 파생 값/콜백: 훅 내부에서 조건 가드
  const listItems: ListItem[] = useMemo(
    () =>
      (items ?? []).map((r) => ({
        id: String(r.id),
        title: r.addressLine ?? (r.posKey ? `좌표 ${r.posKey}` : "주소 미확인"),
        dateISO: r.reservedDate ?? "",
      })),
    [items]
  );

  const handleListItemsChange = useCallback(
    (nextList: ListItem[]) => {
      const orderedIds = nextList.map((li) => String(li.id));

      setItems((prev: MyReservation[] = []) => {
        const map = new Map(prev.map((p) => [String(p.id), p]));
        const next: MyReservation[] = [];

        // 1) 드롭 순서대로 재배치
        for (const id of orderedIds) {
          const found = map.get(id);
          if (found) next.push({ ...found });
        }
        // 2) 누락분 뒤에 유지
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

  // 3) 훅 호출 ‘후’에 조기 리턴
  if (!isSidebarOn) return null;

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
          items={listItems}
          onItemsChange={handleListItemsChange}
          onDeleteItem={(id) => onCancel(id)}
          onReorderIds={onReorder}
        />

        {/* 즐겨찾기 */}
        <SidebarSection
          title={favoritesLoading ? "즐겨찾기 (로딩 중...)" : "즐겨찾기"}
          items={[]} // 평면 리스트 없음
          nestedItems={favoritesLoading ? [] : nestedFavorites}
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
