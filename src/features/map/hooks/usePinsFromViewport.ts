"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchPinsByBBox, type PinPoint } from "@/features/pins/api";
import type { MapMarker } from "@/features/map/types/map";

type UsePinsOpts = {
  map?: kakao.maps.Map | null;
  debounceMs?: number;
  draftState?: "before" | "scheduled" | "all";
};

function toPosKey(lat?: number, lng?: number) {
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`
    : undefined;
}

function pickDisplayName(p: any): string {
  return (
    p?.name ??
    p?.displayName ??
    p?.title ??
    p?.label ??
    p?.addressLine ??
    p?.address ??
    p?.address_name ??
    String(p?.id ?? "")
  );
}

// 👇 B) 변환 단계 로그
function pinPointToMarker(p: PinPoint, source: "pin" | "draft"): MapMarker {
  const lat = Number((p as any).lat ?? (p as any).y);
  const lng = Number((p as any).lng ?? (p as any).x);
  const displayName = String(pickDisplayName(p)).trim();

  console.debug("[pinPointToMarker]", {
    id: String((p as any).id),
    name: (p as any).name,
    picked: displayName,
    lat,
    lng,
    source,
  });

  return {
    id: String(p.id),
    position: { lat, lng },
    name: displayName, // ★ 라벨은 이 값을 씀
    title: displayName, // (툴팁/접근성)
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
}: UsePinsOpts) {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<PinPoint[]>([]);
  const [drafts, setDrafts] = useState<PinPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      });

      // 👇 A) 서버 응답 단계 로그
      console.table(
        (res?.data?.points ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          addressLine: p.addressLine,
        })),
        ["id", "name", "addressLine"]
      );

      setPoints(res.data.points ?? []);
      setDrafts(res.data.drafts ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load pins");
    } finally {
      setLoading(false);
    }
  }, [map, draftState]);

  useEffect(() => {
    if (!map) return;
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(load, debounceMs);
    };
    kakao.maps.event.addListener(map, "idle", schedule);
    schedule();
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

    // 👇 C) 훅 최종 결과 로그
    console.debug(
      "[usePinsFromViewport] markers",
      all.map((m) => ({
        id: String(m.id),
        name: (m as any).name,
        title: m.title,
        lat: m.position.lat,
        lng: m.position.lng,
      }))
    );

    return all;
  }, [points, drafts]);

  return { loading, points, drafts, markers, error, reload: load };
}
