import { useEffect, useMemo, useState } from "react";
import type { MapMarker } from "../../../types/map";
import { PinKind } from "@/features/pins/types";
import {
  fetchUnreservedDrafts,
  BeforeDraft,
} from "@/shared/api/surveyReservations";
import type { MapMenuKey } from "../../../components/MapMenu";

export function usePlannedDrafts({
  filter,
  getBounds,
}: {
  filter: string;
  getBounds: () =>
    | { swLat: number; swLng: number; neLat: number; neLng: number }
    | undefined;
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

  useEffect(() => {
    if (activeMenu !== "plannedOnly") {
      setPlannedDrafts([]);
      setState({ loading: false, error: null });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setState({ loading: true, error: null });
        const bbox = getBounds();
        const list = await fetchUnreservedDrafts(bbox);
        if (!cancelled) {
          const normalized = (list ?? []).map((d: BeforeDraft) => ({
            ...d,
            id: String(d.id),
            lat: Number(d.lat),
            lng: Number(d.lng),
            addressLine: d.addressLine ?? undefined,
          }));
          setPlannedDrafts(normalized);
        }
      } catch (e: any) {
        if (!cancelled)
          setState({
            loading: false,
            error: e?.response?.data?.message || e?.message || "load failed",
          });
      } finally {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeMenu, getBounds]);

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

  const reload = () => {
    // 의도적으로 deps를 바꾸거나, 상위에서 filter를 ‘plannedOnly’로 토글하는 흐름으로 재호출
    // 필요 시 별도 신호 상태 만들어도 OK
  };

  return { plannedDrafts, plannedMarkersOnly, reloadPlanned: reload, state };
}
