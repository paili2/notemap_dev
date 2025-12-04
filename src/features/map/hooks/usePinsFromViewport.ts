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

/** 🔹 라벨에 사용할 "매물명/이름" 선택 */
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

type BBox = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

/** 🔍 BBox 거의 같은지 비교 (애니메이션 중 미세한 오차 방지용) */
function isSameBBox(a: BBox | null, b: BBox | null) {
  if (!a || !b) return false;
  const EPS = 1e-6;
  return (
    Math.abs(a.swLat - b.swLat) +
      Math.abs(a.swLng - b.swLng) +
      Math.abs(a.neLat - b.neLat) +
      Math.abs(a.neLng - b.neLng) <
    EPS
  );
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

  // 🔒 마지막으로 호출한 BBox
  const lastBBoxRef = useRef<BBox | null>(null);

  // 필터 바뀌면 “다음 BBox는 무조건 다시 호출”
  useEffect(() => {
    lastBBoxRef.current = null;
  }, [draftState, isNew, isOld]);

  const load = useCallback(async () => {
    if (!map) return;
    try {
      // 현재 BBox 계산
      const b = map.getBounds();
      const curBBox: BBox = {
        swLat: b.getSouthWest().getLat(),
        swLng: b.getSouthWest().getLng(),
        neLat: b.getNorthEast().getLat(),
        neLng: b.getNorthEast().getLng(),
      };

      // ✅ 같은 BBox로 이미 호출했다면 /map 재요청 스킵
      if (isSameBBox(lastBBoxRef.current, curBBox)) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[usePinsFromViewport] skip duplicated BBox", curBBox);
        }
        return;
      }

      lastBBoxRef.current = curBBox;

      setLoading(true);
      setError(null);

      const res = await fetchPinsByBBox({
        ...curBBox,
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

  // 🔁 지도 idle 시 자동 로드 + 디바운스
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

  /** 🧼 수정 모달 등에서 강제로 다시 불러오고 싶을 때 사용
   *  - lastBBoxRef를 초기화해서, 같은 BBox여도 다음 load에서 다시 GET 나가도록 함
   */
  const reload = useCallback(() => {
    lastBBoxRef.current = null;
    return load();
  }, [load]);

  return { loading, points, drafts, markers, error, reload };
}
