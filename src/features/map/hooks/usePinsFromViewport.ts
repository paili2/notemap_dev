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

/** 🔹 그룹핑/매칭 전용 키 (표시·클러스터 용)
 *  - 절대 이 값을 split(',').map(Number)로 역파싱해 payload 좌표로 사용하지 말 것!
 *  - 실제 전송 좌표는 반드시 원본 lat/lng 값을 그대로 사용
 */
function toPosKey(lat?: number, lng?: number) {
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? `${(lat as number).toFixed(5)},${(lng as number).toFixed(5)}`
    : undefined;
}

/** 🔹 라벨에 사용할 "매물명/이름" 선택
 *  - 주소 계열 필드(addressLine, address, address_name)는 **절대 라벨 텍스트로 사용하지 않음**
 *  - 주소는 MapMarker.address에만 보관
 */
function pickDisplayName(p: any): string {
  return (
    // 매물명/타이틀 계열 우선
    p?.title ??
    p?.name ??
    p?.displayName ??
    p?.label ??
    p?.propertyName ??
    p?.property?.name ??
    p?.property?.title ??
    // 그래도 없으면 id fallback
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

  // 디버그 로그 (원본 좌표/라벨명 확인용)
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
    position: { lat, lng }, // ✅ 원본 좌표 보존 (절삭/반올림 없음)
    name: displayName,
    title: displayName,
    // ✅ 주소는 별도 필드에만 저장 (라벨 텍스트 X)
    address: (p as any).addressLine ?? (p as any).address ?? undefined,
    kind: ((p as any).pinKind ?? "1room") as any,
    source,
    pinDraftId: (p as any).draftId ?? (p as any).pin_draft_id ?? undefined,
    posKey: toPosKey(lat, lng), // 🔹 그룹 키만 고정 소수
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
        // 🔹 신축/구옥 필터 함께 전송
        ...(typeof isNew === "boolean" ? { isNew } : {}),
        ...(typeof isOld === "boolean" ? { isOld } : {}),
      });

      // 서버 응답 요약 로그 (좌표는 굳이 찍지 않음)
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

    // 최종 산출물 로그 (여기서도 원본 좌표/라벨명 확인)
    console.debug(
      "[usePinsFromViewport] markers",
      all.map((m) => ({
        id: String(m.id),
        name: (m as any).name,
        title: m.title,
        address: (m as any).address,
        lat: m.position.lat, // ✅ 소수 절삭 없이 그대로
        lng: m.position.lng,
      }))
    );

    return all;
  }, [points, drafts]);

  return { loading, points, drafts, markers, error, reload: load };
}
