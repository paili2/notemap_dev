import { useMemo } from "react";
import type { MapMarker } from "../../../types/map";
import type { PinKind } from "@/features/pins/types";

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

export function useMergedMarkers(params: {
  localMarkers: MapMarker[];
  serverPoints?: Array<{
    id: string | number;
    title?: string;
    lat: number;
    lng: number;
  }>;
  serverDrafts?: Array<{
    id: string | number;
    title?: string;
    lat: number;
    lng: number;
  }>;
  menuOpen: boolean;
  menuAnchor?: { lat: number; lng: number } | null;
}) {
  const { localMarkers, serverPoints, serverDrafts, menuOpen, menuAnchor } =
    params;

  const serverMarkers: MapMarker[] = useMemo(() => {
    const normals: MapMarker[] = (serverPoints ?? []).map((p) => ({
      id: String(p.id),
      title: p.title ?? "",
      position: { lat: p.lat, lng: p.lng },
      kind: "1room" as PinKind,
    }));
    const drafts: MapMarker[] = (serverDrafts ?? []).map((p) => ({
      id: `__visit__${String(p.id)}`,
      title: p.title ?? "답사예정",
      position: { lat: p.lat, lng: p.lng },
      kind: "question" as PinKind,
    }));
    return [...normals, ...drafts];
  }, [serverPoints, serverDrafts]);

  const mergedMarkers: MapMarker[] = useMemo(() => {
    const byId = new Map<string, MapMarker>();
    localMarkers.forEach((m) => {
      byId.set(String(m.id), {
        ...m,
        position: toNumericPos((m as any).position),
      });
    });
    serverMarkers.forEach((m) => {
      const id = String(m.id);
      if (id === "__draft__" && byId.has("__draft__")) return;
      byId.set(id, { ...m, position: toNumericPos((m as any).position) });
    });
    return Array.from(byId.values());
  }, [localMarkers, serverMarkers]);

  const mergedWithTempDraft: MapMarker[] = useMemo(() => {
    if (menuOpen && menuAnchor) {
      return [
        ...mergedMarkers,
        {
          id: "__draft__",
          title: "선택 위치",
          position: { lat: menuAnchor.lat, lng: menuAnchor.lng },
          kind: "question" as PinKind,
        },
      ];
    }
    return mergedMarkers;
  }, [mergedMarkers, menuOpen, menuAnchor]);

  return { mergedMarkers, mergedWithTempDraft };
}
