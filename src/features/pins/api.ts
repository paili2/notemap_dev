import { api } from "@/shared/api/api";

export type PinPoint = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
};

export type PinsMapResponse = {
  success: boolean;
  path: string;
  data: {
    mode: "point" | "cluster" | string;
    points: PinPoint[];
    drafts: PinPoint[];
  };
};

// ✅ 레이스 방지용 AbortController (마지막 요청만 유효)
let _inFlight: AbortController | null = null;

// 지도 범위 내 핀 조회
export async function fetchPinsByBBox(params: {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}): Promise<PinsMapResponse> {
  // 숫자 보정(혹시 문자열이 들어오더라도 안전)
  const safe = {
    swLat: Number(params.swLat),
    swLng: Number(params.swLng),
    neLat: Number(params.neLat),
    neLng: Number(params.neLng),
  };

  // 이전 요청 중단
  if (_inFlight) _inFlight.abort();
  _inFlight = new AbortController();

  const res = await api.get<PinsMapResponse>("/pins/map", {
    params: safe,
    signal: _inFlight.signal as AbortSignal, // axios@1.6+ 지원
  });

  // 응답 lat/lng이 문자열일 가능성 대비하여 한 번 정규화
  const data = res.data;
  data.data.points = (data.data.points ?? []).map((p) => ({
    ...p,
    lat: Number(p.lat),
    lng: Number(p.lng),
  }));
  data.data.drafts = (data.data.drafts ?? []).map((p) => ({
    ...p,
    lat: Number(p.lat),
    lng: Number(p.lng),
  }));

  return data;
}
