"use client";

import { useMemo } from "react";
import type { MapMarker } from "../../../shared/types/map";
import type { PinKind } from "@/features/pins/types";
import { mapBadgeToPinKind } from "@/features/properties/lib/badge";

/** kakao LatLng/Point 등 다양한 포맷을 좌표 객체로 정규화 */
function toNumericPos(pos: any) {
  if (!pos) return pos;
  if (typeof pos.lat === "number" && typeof pos.lng === "number") return pos;
  if (typeof pos.getLat === "function" && typeof pos.getLng === "function") {
    return { lat: pos.getLat(), lng: pos.getLng() };
  }
  if (typeof pos.lat === "function" && typeof pos.lng === "function") {
    return { lat: pos.lat(), lng: pos.lng() };
  }
  if (typeof pos.y === "number" && typeof pos.x === "number") {
    return { lat: pos.y, lng: pos.x };
  }
  return pos;
}

const posKey = (lat: number, lng: number) =>
  `${lat.toFixed(5)},${lng.toFixed(5)}`;

/** 컨텍스트 메뉴 판정을 위한 메타 포함 타입 */
export type MergedMarker = {
  id: string | number;
  lat: number;
  lng: number;
  name?: string;
  title?: string;
  /** 출처 (실매물 or 임시핀) */
  source: "point" | "draft";
  /** 임시핀일 때 상태 */
  draftState?: "BEFORE" | "SCHEDULED";
};

export function useMergedMarkers(params: {
  localMarkers: MapMarker[];
  serverPoints?: Array<{
    id: string | number;
    name?: string | null; // 🔹 매물명
    title?: string | null; // 🔹 있으면 부제/지역 정도로 사용
    lat: number;
    lng: number;
    badge?: string | null;
  }>;
  serverDrafts?: Array<{
    id: string | number;
    title?: string | null;
    lat: number;
    lng: number;
    draftState?: "BEFORE" | "SCHEDULED";
    badge?: string | null;
  }>;
  menuOpen: boolean;
  menuAnchor?: { lat: number; lng: number } | null;
  /** 🔹 MapMenu 필터 키 (예: "all" | "new" | "old" | "plannedOnly" | "planned") */
  filterKey?: string;
}) {
  const {
    localMarkers,
    serverPoints,
    serverDrafts,
    menuOpen,
    menuAnchor,
    filterKey,
  } = params;

  const isBeforeMode = filterKey === "plannedOnly";
  const isPlannedMode = filterKey === "planned";

  /** 🔸 신축/구옥 필터일 때는 draft(답사예정핀) 자체를 숨김 */
  const hideDraftsForAgeFilter = filterKey === "new" || filterKey === "old";

  // 1) 판정용 메타 배열 (id/좌표/출처/상태)
  const mergedMeta: MergedMarker[] = useMemo(() => {
    const effectivePoints =
      isBeforeMode || isPlannedMode ? [] : serverPoints ?? [];

    const effectiveDrafts =
      hideDraftsForAgeFilter || !serverDrafts
        ? []
        : (serverDrafts ?? []).filter((d) => {
            const state = d.draftState as "BEFORE" | "SCHEDULED" | undefined;
            if (isBeforeMode) return state === "BEFORE";
            if (isPlannedMode) return state === "SCHEDULED";
            return true;
          });

    const normals: MergedMarker[] = effectivePoints.map((p) => {
      const name = (p.name ?? "").trim(); // 🔹 매물명
      const title = (p.title ?? "").trim(); // 🔹 주소/부제

      return {
        id: p.id,
        name: name || title, // 이름 없으면 title로 보충
        title, // 주소는 title에만
        lat: p.lat,
        lng: p.lng,
        source: "point",
      };
    });

    const drafts: MergedMarker[] = effectiveDrafts.map((d) => {
      const title = (d.title ?? "답사예정").trim();
      return {
        id: d.id,
        name: title,
        title,
        lat: d.lat,
        lng: d.lng,
        source: "draft",
        draftState: d.draftState,
      };
    });

    return [...normals, ...drafts];
  }, [
    serverPoints,
    serverDrafts,
    isBeforeMode,
    isPlannedMode,
    hideDraftsForAgeFilter,
  ]);

  // 2) 실제 지도에 뿌릴 마커 배열 (아이콘/타입 포함)
  const serverViewMarkers: MapMarker[] = useMemo(() => {
    const effectivePoints =
      isBeforeMode || isPlannedMode ? [] : serverPoints ?? [];

    const effectiveDrafts =
      hideDraftsForAgeFilter || !serverDrafts
        ? []
        : (serverDrafts ?? []).filter((d) => {
            const state = d.draftState as "BEFORE" | "SCHEDULED" | undefined;
            if (isBeforeMode) return state === "BEFORE";
            if (isPlannedMode) return state === "SCHEDULED";
            return true;
          });

    const normals: MapMarker[] = effectivePoints.map((p) => {
      const kindFromBadge = mapBadgeToPinKind(p.badge);
      const kind: PinKind = (kindFromBadge ?? "1room") as PinKind;

      const name = (p.name ?? "").trim();
      const title = (p.title ?? "").trim();

      return {
        id: String(p.id),
        name: name || title, // ✅ 라벨에 들어갈 텍스트
        title, // ✅ 주소/부제는 title 에만
        position: { lat: p.lat, lng: p.lng },
        kind,
      };
    });

    const drafts: MapMarker[] = effectiveDrafts.map((d) => {
      const kindFromBadge = mapBadgeToPinKind(d.badge);
      const fallback: PinKind = "question";
      const kind: PinKind = (kindFromBadge ?? fallback) as PinKind;

      const label = (d.title ?? "답사예정").trim();

      return {
        id: `__visit__${String(d.id)}`,
        name: label,
        title: label,
        position: { lat: d.lat, lng: d.lng },
        kind,
      };
    });

    return [...normals, ...drafts];
  }, [
    serverPoints,
    serverDrafts,
    isBeforeMode,
    isPlannedMode,
    hideDraftsForAgeFilter,
  ]);

  // 3) 로컬 마커와 서버 마커 병합
  const mergedMarkers: MapMarker[] = useMemo(() => {
    const byId = new Map<string, MapMarker>();

    // 로컬 우선
    localMarkers.forEach((m) => {
      byId.set(String(m.id), {
        ...m,
        position: toNumericPos((m as any).position),
      });
    });

    // 서버로 덮어쓰기 (동일 id면 최신 서버 값 사용)
    serverViewMarkers.forEach((m) => {
      const id = String(m.id);
      if (id === "__draft__" && byId.has("__draft__")) return;
      byId.set(id, { ...m, position: toNumericPos((m as any).position) });
    });

    return Array.from(byId.values());
  }, [localMarkers, serverViewMarkers]);

  // 4) 컨텍스트 메뉴 열릴 때 임시 선택 위치를 question 아이콘으로 추가
  const mergedWithTempDraft: MapMarker[] = useMemo(() => {
    if (!(menuOpen && menuAnchor)) return mergedMarkers;

    const targetKey = posKey(menuAnchor.lat, menuAnchor.lng);

    const hasSamePosKey = mergedMarkers.some((m) => {
      const p: any = (m as any).position ?? m;
      const lat = typeof p.getLat === "function" ? p.getLat() : p.lat;
      const lng = typeof p.getLng === "function" ? p.getLng() : p.lng;
      return posKey(lat, lng) === targetKey;
    });

    if (hasSamePosKey) return mergedMarkers;

    const EPS = 1e-5;
    const overlapWithDraft = mergedMarkers.some((m) => {
      const id = String(m.id ?? "");
      const kind = (m as any).kind;
      const p: any = (m as any).position ?? m;
      const lat = typeof p.getLat === "function" ? p.getLat() : p.lat;
      const lng = typeof p.getLng === "function" ? p.getLng() : p.lng;
      const near =
        Math.abs(lat - menuAnchor.lat) < EPS &&
        Math.abs(lng - menuAnchor.lng) < EPS;
      return near && (kind === "question" || id.startsWith("__visit__"));
    });

    if (overlapWithDraft) return mergedMarkers;

    return [
      ...mergedMarkers,
      {
        id: "__draft__",
        title: "선택 위치",
        position: { lat: menuAnchor.lat, lng: menuAnchor.lng },
        kind: "question" as PinKind,
      },
    ];
  }, [mergedMarkers, menuOpen, menuAnchor]);

  return { mergedMarkers, mergedWithTempDraft, mergedMeta };
}
