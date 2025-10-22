"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  fetchMySurveyReservations,
  MyReservation,
} from "@/shared/api/surveyReservations";

/** 안전 정렬: sortOrder가 있으면 우선, 없으면 뒤로 */
function sortByOrderSafe<T extends { sortOrder?: number }>(arr: T[]) {
  return [...arr].sort((a, b) => {
    const ai = typeof a.sortOrder === "number";
    const bi = typeof b.sortOrder === "number";
    if (ai && bi) return (a.sortOrder as number) - (b.sortOrder as number);
    if (ai && !bi) return -1;
    if (!ai && bi) return 1;
    return 0;
  });
}

/**
 * 내 예약 목록 훅
 * - 서버 로드 시 sortOrder 기준으로 정렬
 * - reservationOrderMap 파생 제공 (pinDraftId -> sortOrder)
 * - refetch()로 새로고침
 * - AbortController로 중복요청 취소
 */
export function useScheduledReservations() {
  const [items, setItems] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // 이전 요청 취소
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const next = await fetchMySurveyReservations(ctrl.signal);
      // ✅ 서버가 내려준 sortOrder로 보정 정렬
      setItems(sortByOrderSafe(next));
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  /** ✅ pinDraftId -> sortOrder 매핑 (맵 라벨 순번에 사용) */
  const reservationOrderMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of items) {
      if (r.pinDraftId != null && typeof r.sortOrder === "number") {
        m[String(r.pinDraftId)] = r.sortOrder;
      }
    }
    return m;
  }, [items]);

  /**
   * (선택) 옵티미스틱 삽입 헬퍼
   * - insertAt 위치로 임시 아이템 넣고 sortOrder 재부여
   * - 서버 성공 시 id/sortOrder로 교체 권장
   */
  const insertOptimistic = useCallback(
    (draft: Omit<MyReservation, "id"> & { id?: string }, insertAt?: number) => {
      const tempId =
        draft.id ??
        `temp_${
          globalThis.crypto?.randomUUID?.() ??
          Math.random().toString(16).slice(2)
        }`;

      setItems((prev) => {
        const at =
          Number.isInteger(insertAt) && (insertAt as number) >= 0
            ? Math.min(insertAt as number, prev.length)
            : prev.length;

        const optimistic: MyReservation = {
          ...draft,
          id: tempId,
          sortOrder: at,
        };

        const next = [...prev];
        next.splice(at, 0, optimistic);
        // 0..N 재부여
        next.forEach((r, i) => (r.sortOrder = i));
        return next;
      });

      return tempId; // 성공 시 교체에 사용
    },
    []
  );

  /**
   * (선택) 옵티미스틱 교체 헬퍼
   * - 서버 응답의 id/sortOrder로 temp 아이템 교체 후 정렬 보정
   */
  const reconcileOptimistic = useCallback(
    (tempId: string, realId: string, sortOrder?: number) => {
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.id === tempId);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          id: realId,
          sortOrder:
            typeof sortOrder === "number" ? sortOrder : next[idx].sortOrder,
        };
        // 서버 기준으로 재정렬 + 0..N 보정
        const sorted = sortByOrderSafe(next);
        sorted.forEach((r, i) => (r.sortOrder = i));
        return sorted;
      });
    },
    []
  );

  return {
    items,
    loading,
    error,
    refetch: load,
    setItems, // 필요 시 외부에서 직접 수정
    reservationOrderMap,
    insertOptimistic, // (선택) 낙관적 삽입
    reconcileOptimistic, // (선택) 서버 성공 후 교체
  } as const;
}
