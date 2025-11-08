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
    title?: string | null;
    lat: number;
    lng: number;
    /** ✅ 서버가 내려주는 뱃지 (예: "R3", "R4_TERRACE", "SURVEY_SCHEDULED" 등) */
    badge?: string | null;
  }>;
  serverDrafts?: Array<{
    id: string | number;
    title?: string | null;
    lat: number;
    lng: number;
    draftState?: "BEFORE" | "SCHEDULED";
    /** (선택) 드래프트에도 배지가 있을 수 있으면 포함 */
    badge?: string | null;
  }>;
  menuOpen: boolean;
  menuAnchor?: { lat: number; lng: number } | null;
}) {
  const { localMarkers, serverPoints, serverDrafts, menuOpen, menuAnchor } =
    params;

  // 1) 판정용 메타 배열 (id/좌표/출처/상태)
  const mergedMeta: MergedMarker[] = useMemo(() => {
    const normals: MergedMarker[] = (serverPoints ?? []).map((p) => ({
      id: p.id,
      title: p.title ?? "",
      lat: p.lat,
      lng: p.lng,
      source: "point",
    }));

    const drafts: MergedMarker[] = (serverDrafts ?? []).map((d) => ({
      id: d.id,
      title: d.title ?? "답사예정",
      lat: d.lat,
      lng: d.lng,
      source: "draft",
      draftState: d.draftState,
    }));

    return [...normals, ...drafts];
  }, [serverPoints, serverDrafts]);

  // 2) 실제 지도에 뿌릴 마커 배열 (아이콘/타입 포함)
  const serverViewMarkers: MapMarker[] = useMemo(() => {
    const normals: MapMarker[] = (serverPoints ?? []).map((p) => {
      // ✅ 서버 badge -> 내부 PinKind 매핑
      const kindFromBadge = mapBadgeToPinKind(p.badge);
      const kind: PinKind = (kindFromBadge ?? "1room") as PinKind;

      return {
        id: String(p.id),
        title: p.title ?? "",
        position: { lat: p.lat, lng: p.lng },
        kind,
      };
    });

    const drafts: MapMarker[] = (serverDrafts ?? []).map((d) => {
      // 드래프트에도 배지가 있다면 반영, 없으면 기본적으로 question
      const kindFromBadge = mapBadgeToPinKind(d.badge);
      const fallback: PinKind = "question";
      const kind: PinKind = (kindFromBadge ?? fallback) as PinKind;

      return {
        id: `__visit__${String(d.id)}`, // 임시핀은 __visit__ 접두사로 구분
        title: d.title ?? "답사예정",
        position: { lat: d.lat, lng: d.lng },
        kind,
      };
    });

    return [...normals, ...drafts];
  }, [serverPoints, serverDrafts]);

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

    // ⛔️ 같은 좌표(posKey) 이미 존재하면 __draft__ 추가하지 않음
    const targetKey = posKey(menuAnchor.lat, menuAnchor.lng);

    // (A) posKey 매칭
    const hasSamePosKey = mergedMarkers.some((m) => {
      const p: any = (m as any).position ?? m;
      const lat = typeof p.getLat === "function" ? p.getLat() : p.lat;
      const lng = typeof p.getLng === "function" ? p.getLng() : p.lng;
      return posKey(lat, lng) === targetKey;
    });

    if (hasSamePosKey) return mergedMarkers;

    // (B) 안전장치: question 아이콘/visit 임시핀과도 좌표 겹치면 추가 금지
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

    // (C) 그 외의 경우에만 임시 draft 마커 추가
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
