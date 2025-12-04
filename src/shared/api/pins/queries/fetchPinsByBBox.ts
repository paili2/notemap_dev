// import { getPinsMapOnce } from "@/shared/api/api";

// export type PinPoint = {
//   id: string | number;
//   lat: number;
//   lng: number;
//   title?: string | null;
//   propertyId?: string | number | null;
// };

// export async function fetchPinsByBBox(params: {
//   swLat: number;
//   swLng: number;
//   neLat: number;
//   neLng: number;
//   draftState?: "before" | "scheduled" | "all";
//   isNew?: boolean;
//   isOld?: boolean;
//   favoriteOnly?: boolean;
// }) {
//   const toNum = (v: number) => {
//     const n = Number(v);
//     if (!Number.isFinite(n)) {
//       throw new Error("fetchPinsByBBox: bounds 값이 유효한 숫자가 아닙니다.");
//     }
//     return n;
//   };

//   const safe: Record<string, any> = {
//     swLat: toNum(params.swLat),
//     swLng: toNum(params.swLng),
//     neLat: toNum(params.neLat),
//     neLng: toNum(params.neLng),
//   };

//   // 🔥 서버에서 받는 필터들 추가
//   if (params.draftState) safe.draftState = params.draftState;
//   if (typeof params.isNew === "boolean") safe.isNew = params.isNew;
//   if (typeof params.isOld === "boolean") safe.isOld = params.isOld;
//   if (typeof params.favoriteOnly === "boolean")
//     safe.favoriteOnly = params.favoriteOnly;

//   const ac = new AbortController();
//   const res = await getPinsMapOnce(safe, ac.signal);
//   const data = res.data;

//   // 응답 좌표도 정밀도 유지
//   data.data.points = (data.data.points ?? []).map((p: any) => ({
//     ...p,
//     lat: Number(p.lat),
//     lng: Number(p.lng),
//   }));
//   data.data.drafts = (data.data.drafts ?? []).map((p: any) => ({
//     ...p,
//     lat: Number(p.lat),
//     lng: Number(p.lng),
//   }));

//   return data;
// }
