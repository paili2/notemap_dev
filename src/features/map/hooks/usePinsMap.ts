"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPinsInBounds,
  type PinsMapDraft,
  type PinsMapPoint,
} from "@/shared/api/pinsMap";

export type Bounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

function debounce<T extends (...a: any[]) => void>(fn: T, ms = 250) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function usePinsMap() {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [points, setPoints] = useState<PinsMapPoint[]>([]);
  const [drafts, setDrafts] = useState<PinsMapDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (filters?: {
      isOld?: boolean;
      isNew?: boolean;
      favoriteOnly?: boolean;
      draftState?: "before" | "scheduled" | "all";
    }) => {
      if (!bounds) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPinsInBounds(
          { ...bounds, ...filters },
          ctrl.signal
        );
        setPoints(Array.isArray(data.points) ? data.points : []);
        setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
      } catch (e: any) {
        if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
          setError(String(e?.message ?? e));
        }
      } finally {
        setLoading(false);
      }
    },
    [bounds]
  );

  // 디바운스된 setter: 카카오맵 idle 이벤트에서 호출
  const setBoundsDebounced = useMemo(
    () => debounce((b: Bounds) => setBounds(b), 150),
    []
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return {
    points,
    drafts, // ← 임시핀(답사예정 포함). draftState로 BEFORE/SCHEDULED 구분
    loading,
    error,
    setBounds: setBoundsDebounced, // 지도 이벤트에서 호출
    refetch: load,
  } as const;
}
