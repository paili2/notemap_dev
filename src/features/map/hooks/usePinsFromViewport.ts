// features/map/hooks/usePinsFromViewport.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchPinsByBBox, type PinPoint } from "@/features/pins/api";
import type { MapMarker } from "@/features/map/shared/types/map";

type UsePinsOpts = {
  map?: kakao.maps.Map | null;
  debounceMs?: number;
  draftState?: "before" | "scheduled" | "all";
  isNew?: boolean;
  isOld?: boolean;
};

/** 🔹 그룹핑/매칭 전용 키 (표시·클러스터 용) */
function toPosKey(lat?: number, lng?: number) {
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? `${(lat as number).toFixed(5)},${(lng as number).toFixed(5)}`
    : undefined;
}

/** 🔹 라벨에 사용할 이름 선택 */
function pickDisplayName(p: any): string {
  return (
    p?.title ??
    p?.name ??
    p?.displayName ??
    p?.label ??
    p?.propertyName ??
    p?.property?.name ??
    p?.property?.title ??
    String(p?.id ?? "")
  );
}

/** PinPoint -> MapMarker 변환 */
function pinPointToMarker(p: PinPoint, source: "pin" | "draft"): MapMarker {
  const lat = Number((p as any).lat ?? (p as any).y);
  const lng = Number((p as any).lng ?? (p as any).x);
  const displayName = String(pickDisplayName(p)).trim();

  console.debug("[pinPointToMarker]", {
    id: String((p as any).id),
    name: (p as any).name,
    title: (p as any).title,
    picked: displayName,
    addressLine: (p as any).addressLine,
    lat,
    lng,
    source,
  });

  return {
    id: String(p.id),
    position: { lat, lng },
    name: displayName,
    title: displayName,
    address: (p as any).addressLine ?? (p as any).address ?? undefined,
    kind: ((p as any).pinKind ?? "1room") as any,
    source,
    pinDraftId: (p as any).draftId ?? (p as any).pin_draft_id ?? undefined,
    posKey: toPosKey(lat, lng),
    isNew: (p as any).isNew ?? undefined,
  };
}

export function usePinsFromViewport({
  map,
  debounceMs = 250,
  draftState,
  isNew,
  isOld,
}: UsePinsOpts) {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<PinPoint[]>([]);
  const [drafts, setDrafts] = useState<PinPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** idle 디바운싱용 타이머 */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!map) return;
    try {
      setLoading(true);
      setError(null);

      const b = map.getBounds();
      const res = await fetchPinsByBBox({
        swLat: b.getSouthWest().getLat(),
        swLng: b.getSouthWest().getLng(),
        neLat: b.getNorthEast().getLat(),
        neLng: b.getNorthEast().getLng(),
        draftState,
        ...(typeof isNew === "boolean" ? { isNew } : {}),
        ...(typeof isOld === "boolean" ? { isOld } : {}),
      });

      console.table(
        (res?.data?.points ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          title: p.title,
          propertyName: (p as any).propertyName,
          addressLine: p.addressLine,
          isNew: (p as any).isNew,
          isOld: (p as any).isOld,
        })),
        ["id", "name", "title", "propertyName", "addressLine", "isNew", "isOld"]
      );

      setPoints(res.data.points ?? []);
      setDrafts(res.data.drafts ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load pins");
    } finally {
      setLoading(false);
    }
  }, [map, draftState, isNew, isOld]);

  /** ✅ 외부에서 강제로 refetch 할 때 쓰는 함수
   *   - pendding 되어 있는 디바운스 타이머를 먼저 지우고
   *   - load()를 한 번만 호출
   */
  const refetch = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await load();
  }, [load]);

  useEffect(() => {
    if (!map) return;

    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(load, debounceMs);
    };

    kakao.maps.event.addListener(map, "idle", schedule);
    schedule(); // 최초 한 번

    return () => {
      if (timer.current) clearTimeout(timer.current);
      kakao.maps.event.removeListener(map, "idle", schedule);
    };
  }, [map, load, debounceMs]);

  const markers: MapMarker[] = useMemo(() => {
    const live = (points ?? []).map((p) => pinPointToMarker(p, "pin"));
    const draftMarkers = (drafts ?? []).map((p) =>
      pinPointToMarker(p, "draft")
    );
    const all = [...live, ...draftMarkers];

    console.debug(
      "[usePinsFromViewport] markers",
      all.map((m) => ({
        id: String(m.id),
        name: (m as any).name,
        title: m.title,
        address: (m as any).address,
        lat: m.position.lat,
        lng: m.position.lng,
      }))
    );

    return all;
  }, [points, drafts]);

  return {
    loading,
    points,
    drafts,
    markers,
    error,
    /** 예전 이름 유지용 */
    reload: load,
    /** 🔥 외부(refetchPins)에서 사용하는 전용 refetch */
    refetch,
  };
}
