"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchPinsByBBox, type PinPoint } from "@/features/pins/api";
import type { MapMarker } from "@/features/map/shared/types/map";

type UsePinsOpts = {
  map?: kakao.maps.Map | null;
  debounceMs?: number;
  draftState?: "before" | "scheduled" | "all";
};

/** 🔹 그룹핑/매칭 전용 키 (표시·클러스터 용)
 *  - 절대 이 값을 split(',').map(Number)로 역파싱해 payload 좌표로 사용하지 말 것!
 *  - 실제 전송 좌표는 반드시 원본(lat/lng)에서 직접 사용
 */
function toPosKey(lat?: number, lng?: number) {
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? `${(lat as number).toFixed(5)},${(lng as number).toFixed(5)}`
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

/** PinPoint -> MapMarker 변환
 *  ⚠️ position.lat/lng 은 원본 double 그대로 (가공 금지)
 *  posKey 만 toFixed(5) 사용
 */
function pinPointToMarker(p: PinPoint, source: "pin" | "draft"): MapMarker {
  const lat = Number((p as any).lat ?? (p as any).y);
  const lng = Number((p as any).lng ?? (p as any).x);
  const displayName = String(pickDisplayName(p)).trim();

  // 디버그 로그 (원본 좌표 확인용)
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
    position: { lat, lng }, // ✅ 원본 좌표 보존
    name: displayName,
    title: displayName,
    address: (p as any).addressLine ?? (p as any).address ?? undefined,
    kind: ((p as any).pinKind ?? "1room") as any,
    source,
    pinDraftId: (p as any).draftId ?? (p as any).pin_draft_id ?? undefined,
    posKey: toPosKey(lat, lng), // 🔹 키만 고정 소수
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

      // 서버 응답 요약 로그 (좌표는 굳이 찍지 않음)
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

    // 최종 산출물 로그 (여기서도 원본 좌표가 찍혀야 정상)
    console.debug(
      "[usePinsFromViewport] markers",
      all.map((m) => ({
        id: String(m.id),
        name: (m as any).name,
        title: m.title,
        lat: m.position.lat, // ✅ 소수 절삭 없이 그대로
        lng: m.position.lng,
      }))
    );

    return all;
  }, [points, drafts]);

  return { loading, points, drafts, markers, error, reload: load };
}
