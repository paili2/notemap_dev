import { api } from "./api";

export type PinsMapQuery = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  isOld?: boolean;
  isNew?: boolean;
  favoriteOnly?: boolean;
  draftState?: "before" | "scheduled" | "all";
};

export type PinsMapPoint = {
  id: string;
  lat: number;
  lng: number;
  badge: string | null;
};
export type PinsMapDraft = {
  id: string;
  lat: number;
  lng: number;
  draftState: "BEFORE" | "SCHEDULED";
};

export type PinsMapResponse = {
  success: boolean;
  path: string;
  data: {
    mode: "point";
    points: PinsMapPoint[];
    drafts: PinsMapDraft[];
  } | null;
  messages?: string[];
  statusCode?: number;
};

export async function fetchPinsInBounds(q: PinsMapQuery, signal?: AbortSignal) {
  const { data } = await api.get<PinsMapResponse>("/pins/map", {
    params: q,
    withCredentials: true,
    signal,
  });
  if (!data?.success || !data?.data) {
    const msg = data?.messages?.join("\n") || "핀 조회 실패";
    throw new Error(msg);
  }
  return data.data; // { mode:"point", points, drafts }
}
