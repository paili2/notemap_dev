export type BBox = {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
};
export type BusStop = { id: string; name: string; lat: number; lng: number };

// NOTE: API_BASE가 비어있으면 같은 오리진의 Next.js API(route.ts)로 갑니다.
// 백엔드 생기면 NEXT_PUBLIC_API_BASE를 https://api.your-backend.com 처럼 바꿔주세요.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function fetchBusStopsByBBox(bbox: BBox): Promise<BusStop[]> {
  const sw = `${bbox.sw.lat},${bbox.sw.lng}`;
  const ne = `${bbox.ne.lat},${bbox.ne.lng}`;
  const url = `${API_BASE}/api/busstops?sw=${sw}&ne=${ne}`;
  const res = await fetch(url, { cache: "no-store" }); // 최신성 우선. 필요하면 SSG/revalidate로 변경
  if (!res.ok) throw new Error("bus api error");
  return (await res.json()) as BusStop[];
}
