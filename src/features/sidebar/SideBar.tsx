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
  // 0) 안전 기본값
  const {
    nestedFavorites = [],
    favoritesLoading,
    setNestedFavorites,
    handleDeleteNestedFavorite,
    handleDeleteSubFavorite,
    handleContractRecordsClick,
  } = useSidebar();

  // 1) 훅 호출(조건문 밖)
  const { items, setItems, refetch } = useScheduledReservations();

  const { onReorder } = useReorderReservations({
    items: items ?? [],
    setItems,
    onSuccess: () => refetch(), // 서버 적용 후 동기화
    onAfterSuccessRefetch: () => refetch(), // 보수적 동기화(선택)
  });

  // ✅ 예약 취소 훅(옵티미스틱 삭제 + 실패 롤백 + 성공 후 refetch)
  const { onCancel } = useCancelReservation(items ?? [], setItems, () =>
    refetch()
  );

  // 2) 파생 리스트
  const listItems: ListItem[] = useMemo(
    () =>
      (items ?? []).map((r) => ({
        id: String(r.id),
        title: r.addressLine ?? (r.posKey ? `좌표 ${r.posKey}` : "주소 미확인"),
        dateISO: r.reservedDate ?? "",
      })),
    [items]
  );

  // ⚠️ 이중 옵티미스틱 방지: onItemsChange는 미리보기/로컬 재정렬을 하지 않음
  // (SidebarSection이 자체적으로 드래그 프리뷰를 처리하지 않는다면,
  //  UI 프리뷰가 꼭 필요할 때만 별도의 "로컬 전용 상태"를 만들어 쓰고,
  //  최종 확정은 onReorderIds로만 처리하세요.)
  const handleListItemsChange = useCallback((_nextList: ListItem[]) => {
    // no-op: 최종 확정은 onReorderIds에서 처리
    // 만약 드래그 중 프리뷰가 꼭 필요하면,
    // 여기서 별도의 previewItems 상태를 관리하세요(본 items는 건드리지 않기).
  }, []);

  // 3) 조기 리턴
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
          onItemsChange={handleListItemsChange} // 프리뷰 필요없으면 no-op 유지
          onDeleteItem={(id) => onCancel(id)}
          onReorderIds={onReorder} // 최종 확정은 이쪽만
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
