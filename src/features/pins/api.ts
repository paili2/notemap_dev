import { getPinsMapOnce } from "@/shared/api/api";

export type PinPoint = {
  id: string | number;
  lat: number;
  lng: number;
  title?: string | null;
  propertyId?: string | number | null;
};

export async function fetchPinsByBBox(params: {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  draftState?: "before" | "scheduled" | "all"; // ← 선택
}) {
  const r6 = (n: number) => Math.round(Number(n) * 1e6) / 1e6;

  // ✅ 기본은 쿼리에서 'draftState'를 아예 빼버림
  const safe: Record<string, any> = {
    swLat: r6(params.swLat),
    swLng: r6(params.swLng),
    neLat: r6(params.neLat),
    neLng: r6(params.neLng),
  };
  if (params.draftState) {
    // 서버가 대문자를 요구한다면 여기서 toUpperCase()
    safe.draftState = params.draftState; // 또는 params.draftState.toUpperCase()
  }

  const ac = new AbortController();
  const res = await getPinsMapOnce(safe, ac.signal);
  const data = res.data;

  data.data.points = (data.data.points ?? []).map((p: any) => ({
    ...p,
    lat: Number(p.lat),
    lng: Number(p.lng),
  }));
  data.data.drafts = (data.data.drafts ?? []).map((p: any) => ({
    ...p,
    lat: Number(p.lat),
    lng: Number(p.lng),
  }));

  return data;
}
