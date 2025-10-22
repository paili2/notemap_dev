"use client";

import { useCallback } from "react";
import type { MyReservation } from "@/shared/api/surveyReservations";
import { cancelSurveyReservation } from "@/shared/api/surveyReservations";
import { useToast } from "@/hooks/use-toast";

/**
 * 예약 취소(DELETE) 훅
 * - 옵티미스틱 삭제 → 실패 시 롤백
 * - 성공/이미취소 케이스 모두 토스트로 안내
 */
export function useCancelReservation(
  items: MyReservation[] | undefined,
  setItems: React.Dispatch<React.SetStateAction<MyReservation[]>>,
  onAfterSuccess?: () => void
) {
  const { toast } = useToast();

  const onCancel = useCallback(
    async (idLike: string | number) => {
      const idStr = String(idLike);
      const prev = items ?? [];

      // 1) 옵티미스틱 제거
      const next = prev.filter((r) => String(r.id) !== idStr);
      setItems(next);

      try {
        const { alreadyCanceled } = await cancelSurveyReservation(idStr);

        toast({
          title: alreadyCanceled ? "이미 취소된 예약" : "예약을 취소했어요",
          description: `예약 ID: ${idStr}${
            alreadyCanceled ? " (서버상 이미 취소됨)" : ""
          }`,
        });

        onAfterSuccess?.(); // 보통 refetch
      } catch (e: any) {
        // 2) 실패 → 롤백
        setItems(prev);

        const status = e?.response?.status;
        if (status === 404) {
          toast({
            variant: "destructive",
            title: "취소 실패 (404)",
            description: "예약을 찾을 수 없습니다.",
          });
        } else if (status === 403) {
          toast({
            variant: "destructive",
            title: "취소 실패 (403)",
            description: "내 예약만 취소할 수 있습니다.",
          });
        } else if (status === 401) {
          toast({
            variant: "destructive",
            title: "로그인이 필요합니다 (401)",
            description: "세션이 만료되었을 수 있어요.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "예약 취소 중 오류",
            description: "잠시 후 다시 시도해 주세요.",
          });
        }
      }
    },
    [items, setItems, toast, onAfterSuccess]
  );

  return { onCancel };
}
