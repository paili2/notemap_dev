"use client";

/** 해버사인 거리(m) */
export function distM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lat2 === lat1 && lng2 === lng1 ? 0 : lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** bounds를 nx×ny 그리드로 쪼개기 */
export function splitBoundsToGrid(
  kakao: any,
  bounds: any,
  nx: number,
  ny: number
) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const minLat = sw.getLat(),
    minLng = sw.getLng();
  const maxLat = ne.getLat(),
    maxLng = ne.getLng();

  const cells: any[] = [];
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      const aLat = minLat + ((maxLat - minLat) * ix) / nx;
      const bLat = minLat + ((maxLat - minLat) * (ix + 1)) / nx;
      const aLng = minLng + ((maxLng - minLng) * iy) / ny;
      const bLng = minLng + ((maxLng - minLng) * (iy + 1)) / ny;
      cells.push(
        new kakao.maps.LatLngBounds(
          new kakao.maps.LatLng(aLat, aLng),
          new kakao.maps.LatLng(bLat, bLng)
        )
      );
    }
  }
  return cells;
}
