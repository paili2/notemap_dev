"use client";

import { useCallback } from "react";
import {
  MyReservation,
  reorderSurveyReservations,
  ReorderItem,
} from "@/shared/api/surveyReservations";

type ReorderDeps = {
  items: MyReservation[];
  setItems: (updater: (prev: MyReservation[]) => MyReservation[]) => void;
  // 선택: 실패/성공 토스트
  onError?: (e: unknown) => void;
  onSuccess?: (count: number) => void;
};

/**
 * 드래그앤드롭 종료 시 호출:
 *   onReorder([{reservationId, sortOrder}, ...])
 * 를 만들어 주는 훅 (옵티미스틱 적용)
 */
export function useReorderReservations({
  items,
  setItems,
  onError,
  onSuccess,
}: ReorderDeps) {
  const reorderLocal = useCallback(
    (orderedIds: string[]) => {
      setItems((prev) => {
        const map = new Map(prev.map((x) => [x.id, x]));
        const next: MyReservation[] = [];
        orderedIds.forEach((id, idx) => {
          const cur = map.get(id);
          if (cur) next.push({ ...cur, sortOrder: idx });
        });
        // 누락된 항목은 뒤로 (서버 비고와 동일한 정책)
        prev.forEach((x) => {
          if (!orderedIds.includes(x.id)) {
            next.push({ ...x, sortOrder: next.length });
          }
        });
        return next;
      });
    },
    [setItems]
  );

  const patchServer = useCallback(
    async (orderedIds: string[]) => {
      const payload: ReorderItem[] = orderedIds.map((id, idx) => ({
        reservationId: id,
        sortOrder: idx,
      }));
      try {
        const { count } = await reorderSurveyReservations(payload);
        onSuccess?.(count);
      } catch (e) {
        onError?.(e);
        // 서버 실패 시 목록 리로드를 권장 (외부에서 refetch 호출)
      }
    },
    [onError, onSuccess]
  );

  /**
   * 통합 핸들러:
   * - orderedIds: 드롭 이후의 "예약 id" 배열(상태가 반영된 최종 순서)
   * - 옵티미스틱 로컬 반영 → 서버 패치
   */
  const onReorder = useCallback(
    (orderedIds: string[]) => {
      reorderLocal(orderedIds);
      patchServer(orderedIds);
    },
    [reorderLocal, patchServer]
  );

  return { onReorder };
}
