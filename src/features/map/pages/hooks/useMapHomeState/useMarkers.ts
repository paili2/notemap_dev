"use client";

import { useCallback, useMemo, useState } from "react";
import type { LatLng } from "@/lib/geo/types";

type UseMarkersArgs = {
  points: any[] | undefined;
  drafts: any[] | undefined;
  draftPin: LatLng | null;
  filter: string;
};

export function useMarkers({
  points,
  drafts,
  draftPin,
  filter,
}: UseMarkersArgs) {
  const [hiddenDraftIds, setHiddenDraftIds] = useState<Set<string>>(new Set());

  const hideDraft = useCallback(
    (draftId: string | number | null | undefined) => {
      if (draftId == null) return;
      const key = String(draftId);
      setHiddenDraftIds((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    []
  );

  const clearHiddenDraft = useCallback((draftId: string | number) => {
    const key = String(draftId);
    setHiddenDraftIds((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const markers = useMemo(() => {
    const visibleDraftsRaw = (drafts ?? []).filter(
      (d: any) => !hiddenDraftIds.has(String(d.id))
    );

    const isPlannedOnlyMode = filter === "plannedOnly";

    const visiblePoints = isPlannedOnlyMode ? [] : points ?? [];

    const visibleDrafts = visibleDraftsRaw.filter((d: any) => {
      if (!isPlannedOnlyMode) return true;
      const state = d.draftState as "BEFORE" | "SCHEDULED" | undefined;
      return state === "BEFORE";
    });

    const pointMarkers = visiblePoints.map((p: any) => ({
      id: String(p.id),
      position: { lat: p.lat, lng: p.lng },
      kind: "1room" as const,
      title: p.badge ?? "",
      isFav: false,
    }));

    const draftMarkers = visibleDrafts.map((d: any) => ({
      id: `__visit__${d.id}`,
      position: { lat: d.lat, lng: d.lng },
      kind: "question" as const,
      isFav: false,
    }));

    const draftPinMarker = draftPin
      ? [
          {
            id: "__draft__",
            position: draftPin,
            kind: "question" as const,
            isFav: false,
          },
        ]
      : [];

    return [...pointMarkers, ...draftMarkers, ...draftPinMarker];
  }, [points, drafts, draftPin, hiddenDraftIds, filter]);

  return {
    markers,
    hideDraft,
    clearHiddenDraft,
    hiddenDraftIds,
  } as const;
}
