import { NextRequest } from "next/server";

// 런타임을 명시(외부 API 호출/노드 라이브러리 사용을 위해 nodejs 권장)
export const runtime = "nodejs"; // 또는 "edge"도 가능하나, 노드 전용 패키지 쓰면 nodejs

// 환경변수 예시 (실제 값은 .env에 저장)
// TOPIS/지자체 API의 베이스 URL & 키
const UPSTREAM_BASE = process.env.TOPIS_BASE!; // 예: "https://api.example.com"
const UPSTREAM_KEY = process.env.TOPIS_KEY!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sw = searchParams.get("sw");
    const ne = searchParams.get("ne");
    if (!sw || !ne) {
      return Response.json({ error: "missing bbox" }, { status: 400 });
    }

    const [swLat, swLng] = sw.split(",").map(Number);
    const [neLat, neLng] = ne.split(",").map(Number);
    if (
      [swLat, swLng, neLat, neLng].some((n) => Number.isNaN(n)) ||
      swLat > neLat ||
      swLng > neLng
    ) {
      return Response.json({ error: "invalid bbox" }, { status: 400 });
    }

    // ▼ 실제 TOPIS/지자체 엔드포인트 스펙에 맞게 쿼리 변환
    // (아래는 예시) 보통 bbox는 minX(경도), minY(위도), maxX, maxY 형태를 사용
    const upstreamUrl = `${UPSTREAM_BASE}/busstops?minX=${swLng}&minY=${swLat}&maxX=${neLng}&maxY=${neLat}&key=${UPSTREAM_KEY}`;

    const upstream = await fetch(upstreamUrl, {
      headers: { accept: "application/json" },
      // 필요한 경우: next: { revalidate: 30 } 또는 cache: "no-store"
    });

    if (!upstream.ok) {
      return Response.json(
        { error: "upstream error", status: upstream.status },
        { status: 502 }
      );
    }

    const raw = await upstream.json();

    // ▼ 응답 매핑: 실제 필드명에 맞게 변경하세요.
    // 예: { arsId, stationId, stationName, y, x }
    const stops =
      (raw?.data ?? raw?.stops ?? []).map((s: any) => ({
        id: String(s.stationId ?? s.arsId ?? s.id),
        name: s.stationName ?? s.name,
        lat: Number(s.y ?? s.lat),
        lng: Number(s.x ?? s.lng),
      })) ?? [];

    return Response.json(stops);
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
