import { LABEL } from "@/features/map/shared/constants";

type Anchor = {
  lat: number;
  lng: number;
  /**
   * 위로 얼마나 올릴지 (px)
   * 기본값: 라벨 높이 + 간격 정도
   */
  offsetY?: number;
};

export function getMenuPosition(
  map: kakao.maps.Map,
  anchor: Anchor
): kakao.maps.LatLng {
  const proj = map.getProjection();
  const base = new kakao.maps.LatLng(anchor.lat, anchor.lng);
  const pt = proj.pointFromCoords(base);

  // 라벨 높이 + 간격만큼 위로 올리기
  const offsetY = anchor.offsetY ?? LABEL.FONT_SIZE + LABEL.GAP_PX + 8; // 숫자는 상황에 맞게 조절

  pt.y -= offsetY;

  return proj.coordsFromPoint(pt);
}
