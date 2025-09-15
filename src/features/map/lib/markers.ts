import type { MapMarker } from "@/features/map/types/map";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { LatLng } from "@/lib/geo/types";

// 좌표 기반으로 안정적인 고유 ID 생성
const visitId = (p: LatLng) =>
  `__visit__${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

export function getMapMarkers(
  filtered: PropertyItem[],
  visitPins: LatLng[] = [], // ✅ 여러 개의 답사예정 핀
  draftPin: LatLng | null = null // ✅ 생성용 단일 드래프트 핀
): MapMarker[] {
  // 기존 매물 핀
  const base: MapMarker[] = filtered.map((p) => ({
    id: String(p.id),
    title: p.title,
    position: { lat: p.position.lat, lng: p.position.lng },
    kind: ((p as any).pinKind ??
      (p as any).markerKind ??
      (p as any).kind ??
      (p as any).view?.pinKind ??
      "1room") as any,
  }));

  // ✅ 답사예정 핀들(여러 개) — 각 핀에 고유 id 부여!
  const visits: MapMarker[] = visitPins.map((pos) => ({
    id: visitId(pos),
    title: "답사예정",
    position: { lat: pos.lat, lng: pos.lng },
    kind: "question" as any, // 아이콘 타입(원하면 별도 kind 지정)
  }));

  // ✅ 생성용 드래프트 핀(있을 때만)
  const drafts: MapMarker[] = draftPin
    ? [
        {
          id: "__draft__", // 단일이므로 그대로 OK
          title: "신규 등록 위치", // 생성 플로우용 레이블
          position: { lat: draftPin.lat, lng: draftPin.lng },
          kind: "question" as any,
        } as MapMarker,
      ]
    : [];

  // 원하는 순서대로 합치기 (답사예정 -> 기존 -> 드래프트)
  return [...visits, ...base, ...drafts];
}
