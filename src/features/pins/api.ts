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
}) {
  const r6 = (n: number) => Math.round(Number(n) * 1e6) / 1e6;

  const safe = {
    swLat: r6(params.swLat),
    swLng: r6(params.swLng),
    neLat: r6(params.neLat),
    neLng: r6(params.neLng),
    draftState: "all",
  };

  // 선택: 최신 요청만 유효하게 하려면 AbortController 사용
  const ac = new AbortController();
  try {
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
  } finally {
    // 필요 시 in-flight 관리
  }
}
