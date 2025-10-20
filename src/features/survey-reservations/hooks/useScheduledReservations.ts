"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchMySurveyReservations,
  MyReservation,
} from "@/shared/api/surveyReservations";

/**
 * 내 예약 목록을 서버에서 가져오는 훅
 * - refetch()로 새로고침 가능
 * - AbortController로 중복 요청 취소
 */
export function useScheduledReservations() {
  const [items, setItems] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const next = await fetchMySurveyReservations(ctrl.signal);
      setItems(next);
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

  return {
    items,
    loading,
    error,
    refetch: load,
    setItems,
  } as const;
}
