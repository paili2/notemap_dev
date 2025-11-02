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
import { useCancelReservation } from "../survey-reservations/hooks/useCancelReservation";
import { useSignout } from "../auth/hooks/useSignout";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../users/api/account";

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
    onSuccess: () => refetch(),
    onAfterSuccessRefetch: () => refetch(),
  });

  const { onCancel } = useCancelReservation(items ?? [], setItems, () =>
    refetch()
  );

  // ✅ 로그아웃 훅
  const { mutate: doSignout, isPending: isSigningOut } = useSignout();

  // ✅ 프로필 정보 가져오기
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 10 * 60 * 1000, // 10분
  });

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

  const handleListItemsChange = useCallback((_nextList: ListItem[]) => {
    // no-op
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

        <div className="flex justify-between items-center p-2 border-t border-gray-200">
          <span className="text-base font-medium text-gray-700">
            {profile?.account?.name || "사용자 계정"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => doSignout()}
            disabled={isSigningOut}
            className="p-0"
            title="로그아웃"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
