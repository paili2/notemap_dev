"use client";

import { useCallback, useEffect, useRef } from "react";
import type React from "react";
import type { MyReservation } from "@/shared/api/surveyReservations";
import { cancelSurveyReservation } from "@/shared/api/surveyReservations";
import { useToast } from "@/hooks/use-toast";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";
import { useQueryClient } from "@tanstack/react-query";
import { useReservationVersion } from "@/features/survey-reservations/store/useReservationVersion";

/**
 * 예약 취소(DELETE) 훅
 * - 전역 스토어(useScheduledReservations) 기반 옵티미스틱 삭제 → 실패 시 롤백
 * - 성공/이미취소 케이스 모두 토스트 안내
 * - ✅ 기존 시그니처(items, setItems, onAfterSuccess)와 완전 호환 (없으면 전역 스토어 자동 사용)
 * - ✅ 성공 시 핀/지도 쿼리까지 무효화 + 예약 버전 bump → 컨텍스트메뉴에 즉시 반영
 */
export function useCancelReservation(
  items?: MyReservation[] | undefined,
  setItems?: React.Dispatch<React.SetStateAction<MyReservation[]>>,
  onAfterSuccess?: () => void
) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const bump = useReservationVersion((s) => s.bump);

  // 전역 스토어 훅
  const {
    items: storeItems,
    setItems: setStoreItems,
    removeByReservationId,
    refetch,
  } = useScheduledReservations();

  // 최신 로컬/전역 스냅샷 보관 (롤백용)
  const latestLocalItemsRef = useRef<MyReservation[] | undefined>(items);
  const latestStoreItemsRef = useRef<MyReservation[]>(storeItems);

  useEffect(() => {
    latestLocalItemsRef.current = items;
  }, [items]);

  useEffect(() => {
    latestStoreItemsRef.current = storeItems;
  }, [storeItems]);

  const onCancel = useCallback(
    async (idLike: string | number) => {
      const idStr = String(idLike);

      // 롤백 대비 스냅샷
      const prevLocal = latestLocalItemsRef.current ?? [];
      const prevStore = latestStoreItemsRef.current;

      // 1) 옵티미스틱 제거
      // - 전역 스토어: 컨텍스트 메뉴/라벨 등 지도 UI가 즉시 반영
      removeByReservationId(idStr);

      // - 로컬 목록 UI를 별도로 관리 중이라면(리스트 컴포넌트 등) 같이 반영
      if (setItems && latestLocalItemsRef.current) {
        const nextLocal = prevLocal.filter((r) => String(r.id) !== idStr);
        setItems(nextLocal);
      }

      try {
        const { alreadyCanceled } = await cancelSurveyReservation(idStr);

        toast({
          title: alreadyCanceled ? "이미 취소된 예약" : "예약을 취소했어요",
          description: `예약 ID: ${idStr}${
            alreadyCanceled ? " (서버상 이미 취소됨)" : ""
          }`,
        });

        // ✅ 예약 리스트 동기화
        onAfterSuccess?.();
        refetch();

        // ✅ 지도/핀 쿼리 무효화 → draftState, mergedMeta 등이 최신으로 갱신됨
        //   - 실제 프로젝트의 map 쿼리 키에 맞게 조정 가능
        //   - 너무 넓게 invalidate 하기 싫으면 ["pins", "map"] 등으로 좁혀도 OK
        qc.invalidateQueries({ queryKey: ["pins"] });

        // ✅ 예약 버전 bump → version 구독 중인 컴포넌트들이 재평가
        bump();
      } catch (e: any) {
        // 2) 실패 → 롤백
        // - 전역 스토어 롤백
        setStoreItems(prevStore);

        // - 로컬 롤백
        if (setItems) {
          setItems(prevLocal);
        }

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
    [
      removeByReservationId,
      refetch,
      setItems,
      setStoreItems,
      toast,
      onAfterSuccess,
      qc,
      bump,
    ]
  );

  return { onCancel };
}
