"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  MyReservation,
  reorderSurveyReservations,
  ReorderItem,
} from "@/shared/api/survey-reservations/surveyReservations";

type ReorderDeps = {
  items: MyReservation[];
  setItems: (updater: (prev: MyReservation[]) => MyReservation[]) => void;
  // 선택: 실패/성공 토스트
  onError?: (e: unknown) => void;
  onSuccess?: (count: number) => void;
  // 선택: 서버 성공/실패와 무관하게 마지막에 동기화하고 싶을 때
  onAfterSuccessRefetch?: () => void;
};

/** 내부 유틸: 0..N-1 정규화 */
function normalizeZeroBase<T extends { sortOrder?: number }>(arr: T[]) {
  return arr.map((it, idx) => ({ ...it, sortOrder: idx }));
}

/** 중복 제거(앞에 나온 것을 우선) */
function uniqPreserveOrder<T>(arr: T[]) {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

/**
 * 드래그앤드롭 종료 시 호출:
 *   onReorder([{reservationId, sortOrder}, ...])
 * 를 만들어 주는 훅 (옵티미스틱 적용 + 실패 롤백)
 */
export function useReorderReservations({
  items,
  setItems,
  onError,
  onSuccess,
  onAfterSuccessRefetch,
}: ReorderDeps) {
  // 최신 스냅샷(롤백용)
  const snapshotRef = useRef<MyReservation[]>(items);
  useEffect(() => {
    snapshotRef.current = items;
  }, [items]);

  /**
   * 로컬 옵티미스틱 반영
   * - orderedIds 순서대로 sortOrder 재부여
   * - 누락된 항목은 기존 상대순서를 유지한 채 뒤에 배치
   * - 최종 0..N-1 정규화
   */
  const reorderLocal = useCallback(
    (orderedIdsInput: string[]) => {
      const orderedIds = uniqPreserveOrder(orderedIdsInput);
      setItems((prev) => {
        // id -> item 맵
        const map = new Map(prev.map((x) => [x.id, x]));
        const next: MyReservation[] = [];

        // 1) 드롭으로 전달된 id 순서대로 배치
        orderedIds.forEach((id, idx) => {
          const cur = map.get(id);
          if (cur) next.push({ ...cur, sortOrder: idx });
        });

        // 2) 누락된 항목은 기존 배열 순서대로 뒤에 붙이기
        prev.forEach((x) => {
          if (!orderedIds.includes(x.id)) {
            next.push({ ...x, sortOrder: next.length });
          }
        });

        // 3) 0..N-1 보정
        return normalizeZeroBase(next);
      });
    },
    [setItems]
  );

  /**
   * 서버 패치
   * - orderedIds만 담아 전송(누락 항목은 서버가 뒤로 자동 배치)
   * - 실패 시 롤백
   */
  const patchServer = useCallback(
    async (orderedIdsInput: string[]) => {
      const orderedIds = uniqPreserveOrder(orderedIdsInput);

      const payload: ReorderItem[] = orderedIds.map((id, idx) => ({
        reservationId: id,
        sortOrder: Math.max(0, Math.floor(idx)),
      }));

      try {
        const { count } = await reorderSurveyReservations(payload);
        onSuccess?.(count);
      } catch (e) {
        // 롤백
        setItems(() => snapshotRef.current);
        onError?.(e);
      } finally {
        // 선택: 서버 진실과 동기화를 원하면 외부에서 refetch
        onAfterSuccessRefetch?.();
      }
    },
    [onError, onSuccess, onAfterSuccessRefetch, setItems]
  );

  /**
   * 통합 핸들러:
   * - orderedIds: 드롭 이후의 "예약 id" 배열(최종 순서)
   * - 옵티미스틱 로컬 반영 → 서버 패치(실패 시 롤백)
   */
  const onReorder = useCallback(
    (orderedIds: string[]) => {
      // 스냅샷 저장(롤백 대비)
      const prevSnapshot = snapshotRef.current;
      snapshotRef.current = prevSnapshot.map((x) => ({ ...x }));
      reorderLocal(orderedIds);
      void patchServer(orderedIds);
    },
    [reorderLocal, patchServer]
  );

  return { onReorder };
}
