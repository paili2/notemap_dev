import type { MapMarker } from "@/features/map/types/map";
import type { PropertyItem } from "@/features/properties/types/propertyItem";

export function getMapMarkers(
  filtered: PropertyItem[],
  draftPin: { lat: number; lng: number } | null
): MapMarker[] {
  const base = filtered.map((p) => ({
    id: p.id,
    title: p.title,
    position: { lat: p.position.lat, lng: p.position.lng },
    kind: ((p as any).pinKind ??
      (p as any).markerKind ??
      (p as any).kind ??
      (p as any).view?.pinKind ??
      "1room") as any,
  }));
  if (draftPin) {
    base.unshift({
      id: "__draft__",
      title: "신규 등록 위치",
      position: { lat: draftPin.lat, lng: draftPin.lng },
      kind: (draftPin as any).pinKind ?? "question",
    } as any);
  }
  return base;
}
