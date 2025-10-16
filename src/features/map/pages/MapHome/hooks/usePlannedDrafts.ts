import { useEffect, useMemo, useRef, useState } from "react";
import type { MapMarker } from "../../../types/map";
import { PinKind } from "@/features/pins/types";
import {
  fetchUnreservedDrafts,
  BeforeDraft,
} from "@/shared/api/surveyReservations";
import type { MapMenuKey } from "../../../components/MapMenu";

type Bounds = { swLat: number; swLng: number; neLat: number; neLng: number };

export function usePlannedDrafts({
  filter,
  getBounds,
}: {
  filter: string;
  getBounds: () => Bounds | undefined;
}) {
  const activeMenu = (filter as MapMenuKey) ?? "all";

  const [plannedDrafts, setPlannedDrafts] = useState<
    Array<{ id: string; lat: number; lng: number; addressLine?: string }>
  >([]);
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  // 함수 레퍼런스는 ref에 저장 (deps에서 제거)
  const getBoundsRef = useRef(getBounds);
  useEffect(() => {
    getBoundsRef.current = getBounds;
  }, [getBounds]);

  // 마지막으로 사용한 bounds 스냅샷 key 저장해서 과도한 재호출 방지
  const lastKeyRef = useRef<string | null>(null);
  const makeKey = (b?: Bounds) =>
    b
      ? `${b.swLat.toFixed(6)}|${b.swLng.toFixed(6)}|${b.neLat.toFixed(
          6
        )}|${b.neLng.toFixed(6)}`
      : "none";

  useEffect(() => {
    if (activeMenu !== "plannedOnly") {
      // plannedOnly가 아니면 리셋하고 끝
      setPlannedDrafts([]);
      setState({ loading: false, error: null });
      // 키도 초기화 (선택)
      lastKeyRef.current = null;
      return;
    }

    const bounds = getBoundsRef.current?.();
    const key = makeKey(bounds);

    // bounds 변동이 없으면 재요청하지 않음
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    let cancelled = false;
    (async () => {
      try {
        setState({ loading: true, error: null });

        const list = await fetchUnreservedDrafts(bounds);
        if (cancelled) return;

        const normalized = (list ?? []).map((d: BeforeDraft) => ({
          ...d,
          id: String(d.id),
          lat: Number(d.lat),
          lng: Number(d.lng),
          addressLine: d.addressLine ?? undefined,
        }));

        // 동일 결과면 setState 생략 (불필요한 렌더 방지)
        const prevJson = JSON.stringify(plannedDrafts);
        const nextJson = JSON.stringify(normalized);
        if (prevJson !== nextJson) {
          setPlannedDrafts(normalized);
        }

        setState((s) => ({ ...s, loading: false }));
      } catch (e: any) {
        if (!cancelled) {
          setState({
            loading: false,
            error: e?.response?.data?.message || e?.message || "load failed",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // ✅ deps에서 getBounds 제외, bounds 변경은 key로 판정
  }, [activeMenu]); // ← 여기서 함수 의존성 제거

  const plannedMarkersOnly: MapMarker[] = useMemo(
    () =>
      plannedDrafts.map((d) => ({
        id: `__visit__${String(d.id)}`,
        title: d.addressLine ?? "답사예정",
        position: { lat: d.lat, lng: d.lng },
        kind: "question" as PinKind,
      })),
    [plannedDrafts]
  );

  const reloadPlanned = () => {
    // 강제 새로고침: lastKey를 비워두고 effect 재실행 트리거 (예: filter를 plannedOnly로 다시 세팅)
    lastKeyRef.current = null;
    // 보통은 상위에서 filter를 다른 값 -> 다시 plannedOnly로 토글하거나,
    // 또는 여기서 별도 신호 state를 만들어 deps에 넣어도 됩니다.
  };

  return { plannedDrafts, plannedMarkersOnly, reloadPlanned, state };
}
