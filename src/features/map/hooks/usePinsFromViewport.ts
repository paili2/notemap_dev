"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPinsByBBox, type PinPoint } from "@/features/pins/api";

type UsePinsOpts = {
  map?: kakao.maps.Map | null;
  debounceMs?: number;
};

export function usePinsFromViewport({ map, debounceMs = 250 }: UsePinsOpts) {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<PinPoint[]>([]);
  const [drafts, setDrafts] = useState<PinPoint[]>([]); // ✅ drafts 추가
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!map) return;
    try {
      setLoading(true);
      setError(null);

      // ✅ 타입 단언으로 안전하게 호출 (이미 !map 가드 있음)
      const bounds = (map as kakao.maps.Map).getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const res = await fetchPinsByBBox({
        swLat: sw.getLat(),
        swLng: sw.getLng(),
        neLat: ne.getLat(),
        neLng: ne.getLng(),
      });

      // ✅ points + drafts 모두 반영
      setPoints(res.data.points ?? []);
      setDrafts(res.data.drafts ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load pins");
    } finally {
      setLoading(false);
    }
  }, [map]);

  // 지도 이동/줌 변경 시 디바운스 호출
  useEffect(() => {
    if (!map) return;

    const handler = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(load, debounceMs);
    };

    kakao.maps.event.addListener(map, "dragend", handler);
    kakao.maps.event.addListener(map, "zoom_changed", handler);

    // 최초 1회 로드
    handler();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      kakao.maps.event.removeListener(map, "dragend", handler);
      kakao.maps.event.removeListener(map, "zoom_changed", handler);
    };
  }, [map, load, debounceMs]);

  // ✅ drafts도 반환 (임시핀 = 물음표 아이콘 매핑용)
  return { loading, points, drafts, error, reload: load };
}
