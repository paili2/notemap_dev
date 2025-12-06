import type { MapMarkerTagged } from "@/features/map/shared/types/map";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { LatLng } from "@/lib/geo/types";

/**
 * 좌표 기반으로 안정적인 고유 ID 생성
 * ⚠️ 절대 이 ID를 split(',') 등으로 파싱해 좌표로 재사용하지 말 것!
 *    좌표는 항상 position.lat / position.lng 원본을 직접 사용.
 */
const visitId = (p: LatLng) => `__visit__${String(p.lat)},${String(p.lng)}`;

export function getMapMarkers(
  filtered: PropertyItem[],
  visitPins: LatLng[] = [],
  draftPin: LatLng | null = null
): MapMarkerTagged[] {
  // 기존 매물 핀
  const base: MapMarkerTagged[] = filtered.map((p) => ({
    id: String(p.id),
    title: p.title,
    position: { lat: p.position.lat, lng: p.position.lng }, // ← 원본 그대로
    kind: ((p as any).pinKind ??
      (p as any).markerKind ??
      (p as any).kind ??
      (p as any).view?.pinKind ??
      "1room") as any,
    tag: "property",
  }));

  // 답사예정 핀들(여러 개)
  const visits: MapMarkerTagged[] = visitPins.map((pos) => ({
    id: visitId(pos), // ← 더 이상 toFixed(6) 안 씀
    title: "답사예정",
    position: { lat: pos.lat, lng: pos.lng }, // ← 원본 그대로
    kind: "question" as any,
    tag: "visit",
  }));

  // 생성용 드래프트 핀(있을 때만)
  const drafts: MapMarkerTagged[] = draftPin
    ? [
        {
          id: "__draft__",
          title: "신규 등록 위치",
          position: { lat: draftPin.lat, lng: draftPin.lng }, // ← 원본 그대로
          kind: "question" as any,
          tag: "draft",
        },
      ]
    : [];

  // 원하는 순서대로 합치기 (답사예정 -> 기존 -> 드래프트)
  return [...visits, ...base, ...drafts];
}

// 방문핀 판별 유틸(어디서든 재사용)
export const isVisitMarker = (m: { id: string; tag?: string }) =>
  m.tag === "visit" || String(m.id).startsWith("__visit__");
