// features/map/pages/hooks/useMarkersForMapHome.ts
"use client";

import { useMemo } from "react";
import type { LatLng } from "@/lib/geo/types";
import type { MapMarker } from "@/features/map/shared/types/map";

// ⭐ MapMarker 확장: isFav는 선택 필드로만 추가
export type MapMarkerWithFav = MapMarker & { isFav?: boolean };

type UseMarkersArgs = {
  points: any[] | undefined;
  drafts: any[] | undefined;
  draftPin: LatLng | null;
  hiddenDraftIds: Set<string>;
  filter: string;
};

export function useMarkersForMapHome({
  points,
  drafts,
  draftPin,
  hiddenDraftIds,
  filter,
}: UseMarkersArgs): MapMarkerWithFav[] {
  return useMemo(() => {
    // 0) drafts 배열에서 숨긴 것 제외
    const visibleDraftsRaw = (drafts ?? []).filter(
      (d: any) => !hiddenDraftIds.has(String(d.id))
    );

    // 1) 필터 모드 판별
    const isPlannedOnlyMode = filter === "plannedOnly";

    // 2) 매물핀: plannedOnly 모드에서는 안 보이게
    const visiblePoints = isPlannedOnlyMode ? [] : points ?? [];

    // 3) 임시핀: plannedOnly 모드일 때는 draftState === "BEFORE" 만 남기기
    const visibleDrafts = visibleDraftsRaw.filter((d: any) => {
      if (!isPlannedOnlyMode) return true;
      const state = d.draftState as "BEFORE" | "SCHEDULED" | undefined;
      return state === "BEFORE";
    });

    // 4) 매물핀 마커 변환
    const pointMarkers: MapMarkerWithFav[] = visiblePoints.map((p: any) => ({
      id: String(p.id),
      position: { lat: p.lat, lng: p.lng },
      kind: "1room" as const,
      title: p.badge ?? "",
      isFav: false,
    }));

    // 5) 임시핀 마커 변환 (__visit__ 접두사)
    const draftMarkers: MapMarkerWithFav[] = visibleDrafts.map((d: any) => ({
      id: `__visit__${d.id}`,
      position: { lat: d.lat, lng: d.lng },
      kind: "question" as const,
      isFav: false,
    }));

    // 6) 화면에서 선택한 임시 draftPin
    const draftPinMarker: MapMarkerWithFav[] = draftPin
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
}
