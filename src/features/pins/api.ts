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
  // ❗ 좌표는 절대 자르지 않고 원본 정밀도로 그대로 전송
  // (NaN 가드만 수행)
  const toNum = (v: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) {
      throw new Error("fetchPinsByBBox: bounds 값이 유효한 숫자가 아닙니다.");
    }
    return n;
  };

  const safe: Record<string, any> = {
    swLat: toNum(params.swLat),
    swLng: toNum(params.swLng),
    neLat: toNum(params.neLat),
    neLng: toNum(params.neLng),
  };

  if (params.draftState) {
    // 서버가 대문자 요구 시: params.draftState.toUpperCase()
    safe.draftState = params.draftState;
  }

  const ac = new AbortController();
  const res = await getPinsMapOnce(safe, ac.signal);
  const data = res.data;

  // 응답 좌표도 정밀도 유지: 숫자 캐스팅만 (자르지 않음)
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
