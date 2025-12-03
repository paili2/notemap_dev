"use client";

import { distM, splitBoundsToGrid } from "./geometry";
import { NEAR_RATIO } from "./constants";

/** 카테고리 검색(페이징 자동) */
export function searchCategoryAllPagesByBounds(
  kakao: any,
  places: any,
  categoryCode: string,
  bounds: any,
  hardLimit = 200
): Promise<any[]> {
  return new Promise((resolve) => {
    const acc: any[] = [];
    const handle = (data: any[], status: string, pagination: any) => {
      if (status === kakao.maps.services.Status.OK && Array.isArray(data)) {
        acc.push(...data);
        if (acc.length >= hardLimit) return resolve(acc.slice(0, hardLimit));
        if (pagination && pagination.hasNextPage) return pagination.nextPage();
      }
      resolve(acc);
    };
    places.categorySearch(categoryCode, handle, { bounds });
  });
}

/**
 * 키워드 검색(페이징 자동)
 * - bounds 우선
 * - 부족하면 x/y/radius 폴백
 * - keyword: string | string[]
 *   예) 안전기관(poiKind: "safety") → ["경찰서", "소방서"]
 */
export async function searchKeywordAllPagesByBounds(
  kakao: any,
  places: any,
  keyword: string | string[],
  bounds: any,
  hardLimit = 200
): Promise<any[]> {
  const keywords = Array.isArray(keyword) ? keyword : [keyword];

  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const cLat = (sw.getLat() + ne.getLat()) / 2;
  const cLng = (sw.getLng() + ne.getLng()) / 2;

  const widthM = distM(ne.getLat(), sw.getLng(), ne.getLat(), ne.getLng());
  const heightM = distM(sw.getLat(), sw.getLng(), ne.getLat(), sw.getLng());
  const radiusM = Math.min(
    20000,
    Math.max(100, Math.ceil(Math.max(widthM, heightM) / 2))
  );

  const runOne = (kw: string) =>
    new Promise<any[]>((resolve) => {
      const acc: any[] = [];
      const finish = () => resolve(acc.slice(0, hardLimit));

      const handleBounds = (data: any[], status: string, pagination: any) => {
        if (status === kakao.maps.services.Status.OK && Array.isArray(data)) {
          acc.push(...data);
          if (acc.length >= hardLimit) return finish();
          if (pagination && pagination.hasNextPage)
            return pagination.nextPage();
        }
        const handleXY = (data2: any[], status2: string, pagination2: any) => {
          if (
            status2 === kakao.maps.services.Status.OK &&
            Array.isArray(data2)
          ) {
            acc.push(...data2);
            if (acc.length >= hardLimit) return finish();
            if (pagination2 && pagination2.hasNextPage)
              return pagination2.nextPage();
          }
          finish();
        };
        places.keywordSearch(kw, handleXY, {
          x: cLng,
          y: cLat,
          radius: radiusM,
        });
      };

      places.keywordSearch(kw, handleBounds, { bounds });
    });

  const all: any[] = [];
  for (const kw of keywords) {
    const chunk = await runOne(kw);
    all.push(...chunk);
    if (all.length >= hardLimit) break;
  }

  // ✅ id 또는 (x,y) 기준 dedup
  const seen = new Set<string>();
  const uniq: any[] = [];
  for (const p of all) {
    const id = p.id ?? `${p.x},${p.y}`;
    if (seen.has(id)) continue;
    seen.add(id);
    uniq.push(p);
    if (uniq.length >= hardLimit) break;
  }
  return uniq;
}

/** 중심 가까운/먼 결과를 섞어 채우기 */
export function pickNearFar(
  list: any[],
  centerLat: number,
  centerLng: number,
  radiusM: number,
  maxCount: number,
  nearRatio = NEAR_RATIO
) {
  const near: Array<{ p: any; d: number }> = [];
  const far: Array<{ p: any; d: number }> = [];

  for (const p of list) {
    const d = distM(Number(p.y), Number(p.x), centerLat, centerLng);
    (d <= radiusM ? near : far).push({ p, d });
  }
  near.sort((a, b) => a.d - b.d);
  far.sort((a, b) => a.d - b.d);

  const nearTarget = Math.min(Math.round(maxCount * nearRatio), near.length);
  return [
    ...near.slice(0, nearTarget).map((x) => x.p),
    ...far.slice(0, maxCount - nearTarget).map((x) => x.p),
  ];
}

/**
 * 화면이 넓을수록 bounds를 더 잘게 나누고,
 * 중심에 가까운 셀부터 검색하도록 정렬
 */
export function gridCellsSortedByCenter(
  kakao: any,
  boundsObj: any,
  shortEdgeM: number,
  map: any
) {
  const gridSize = shortEdgeM > 3200 ? 3 : shortEdgeM > 2000 ? 2 : 1;
  const cells =
    gridSize > 1
      ? splitBoundsToGrid(kakao, boundsObj, gridSize, gridSize)
      : [boundsObj];

  const center = map.getCenter();
  const cLat = center.getLat();
  const cLng = center.getLng();
  const cellCenter = (b: any) => {
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    return {
      lat: (sw.getLat() + ne.getLat()) / 2,
      lng: (sw.getLng() + ne.getLng()) / 2,
    };
  };

  cells.sort((a, b) => {
    const A = cellCenter(a);
    const B = cellCenter(b);
    return distM(A.lat, A.lng, cLat, cLng) - distM(B.lat, B.lng, cLat, cLng);
  });

  return cells;
}
