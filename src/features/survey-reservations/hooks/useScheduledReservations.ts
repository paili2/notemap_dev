"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  fetchMySurveyReservations,
  MyReservation,
} from "@/shared/api/surveyReservations";

/** 서버 규칙과 동일한 안정 정렬:
 * 1) sortOrder ASC (없으면 뒤로)
 * 2) reservedDate ASC (문자열 비교; null/undefined는 뒤로)
 * 3) id ASC (문자열 비교)
 */
function sortByServerRuleLocal<
  T extends {
    sortOrder?: number;
    reservedDate?: string | null;
    id: string;
  }
>(arr: T[]) {
  return [...arr].sort((a, b) => {
    const ao =
      typeof a.sortOrder === "number" ? a.sortOrder : Number.POSITIVE_INFINITY;
    const bo =
      typeof b.sortOrder === "number" ? b.sortOrder : Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;

    const ad = a.reservedDate ?? "";
    const bd = b.reservedDate ?? "";
    if (ad !== bd) return ad < bd ? -1 : 1;

    return a.id.localeCompare(b.id);
  });
}

/** 0..N-1 정규화(현재 순서대로 인덱스를 sortOrder에 재부여) */
function normalizeZeroBase<T extends { sortOrder?: number }>(arr: T[]) {
  return arr.map((it, idx) => ({ ...it, sortOrder: idx }));
}

/** 좌표 → posKey("lat.toFixed(5),lng.toFixed(5)") */
function toPosKey(lat?: number | null, lng?: number | null) {
  if (typeof lat !== "number" || typeof lng !== "number") return undefined;
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

/**
 * 내 예약 목록 훅
 * - 서버 로드 시 [sortOrder → reservedDate → id] 기준 안정 정렬
 * - reservationOrderMap 파생 제공 (pinDraftId -> sortOrder)
 * - reservationOrderByPosKey 제공 (posKey -> sortOrder; posKey 없으면 lat/lng로 생성)
 * - refetch()로 새로고침
 * - AbortController로 중복요청 취소
 * - 옵티미스틱 삽입/교체 유틸 제공
 * - getOrderIndex() 유틸 제공(마커 렌더에서 바로 사용)
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
      // ✅ 서버가 내려준 정렬 + 로컬 보정(동일 규칙)으로 안정화
      const sorted = sortByServerRuleLocal(next);
      // ✅ 보수적으로 0..N-1 재부여(서버가 보장하더라도 UI 일관성)
      setItems(normalizeZeroBase(sorted));
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

  /** ✅ posKey -> sortOrder 매핑 (posKey 없으면 lat/lng로 생성해서 매칭 보강) */
  const reservationOrderByPosKey = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of items) {
      if (typeof r.sortOrder !== "number") continue;
      const key = r.posKey ?? toPosKey(r.lat ?? undefined, r.lng ?? undefined);
      if (key) m[key] = r.sortOrder;
    }
    return m;
  }, [items]);

  /**
   * 마커 → 예약 순번(0-based) 해석 유틸
   * 우선순위: pinDraftId/id → posKey → undefined
   */
  const getOrderIndex = useCallback(
    (marker: {
      source?: "draft" | "point";
      id?: string | number;
      pinDraftId?: string | number;
      posKey?: string;
      lat?: number;
      lng?: number;
    }) => {
      // 1) draft면 pinDraftId(없으면 id)로 매칭
      if (marker.source === "draft") {
        const draftId = marker.pinDraftId ?? marker.id;
        if (draftId != null) {
          const hit = reservationOrderMap[String(draftId)];
          if (typeof hit === "number") return hit; // 0-based
        }
      }
      // 2) posKey 매칭
      const key = marker.posKey ?? toPosKey(marker.lat, marker.lng);
      if (key && typeof reservationOrderByPosKey[key] === "number") {
        return reservationOrderByPosKey[key];
      }
      // 3) 없음
      return undefined;
    },
    [reservationOrderMap, reservationOrderByPosKey]
  );

  /**
   * (선택) 옵티미스틱 삽입 헬퍼
   * - insertAt 위치로 임시 아이템 삽입
   * - 뒤 항목은 +1 밀리고, 최종적으로 0..N-1 재부여
   * - 서버 성공 시 id/sortOrder로 교체 권장(reconcileOptimistic)
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
        // 안전한 삽입 위치 계산
        const at =
          Number.isInteger(insertAt) && (insertAt as number) >= 0
            ? Math.min(insertAt as number, prev.length)
            : prev.length;

        const optimistic: MyReservation = {
          ...draft,
          id: tempId,
          sortOrder: at,
        };

        // 뒤 항목 +1 밀기 → 삽입 → 0..N-1 재부여 → 서버 규칙 정렬(보정)
        const shifted = prev.map((it) =>
          typeof it.sortOrder === "number" && it.sortOrder >= at
            ? { ...it, sortOrder: (it.sortOrder as number) + 1 }
            : it
        );
        const next = [...shifted, optimistic];
        const normalized = normalizeZeroBase(sortByServerRuleLocal(next));
        return normalized;
      });

      return tempId; // 서버 응답으로 교체할 때 사용할 임시 id 반환
    },
    []
  );

  /**
   * (선택) 옵티미스틱 교체 헬퍼
   * - 서버 응답의 id/sortOrder로 temp 아이템 교체
   * - 정렬 규칙 재적용 + 0..N-1 재부여로 안정화
   */
  const reconcileOptimistic = useCallback(
    (tempId: string, realId: string, sortOrder?: number) => {
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.id === tempId);
        if (idx < 0) return prev;

        const next = [...prev];
        const current = next[idx];

        next[idx] = {
          ...current,
          id: realId,
          sortOrder:
            typeof sortOrder === "number" ? sortOrder : current.sortOrder,
        };

        const stabilized = normalizeZeroBase(sortByServerRuleLocal(next));
        return stabilized;
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
    reservationOrderMap, // pinDraftId -> 0-based sortOrder
    reservationOrderByPosKey, // posKey -> 0-based sortOrder
    getOrderIndex, // 마커에서 바로 순번 추출할 때 사용
    insertOptimistic, // (선택) 낙관적 삽입
    reconcileOptimistic, // (선택) 서버 성공 후 교체
  } as const;
}
