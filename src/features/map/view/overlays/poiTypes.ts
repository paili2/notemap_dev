/** POI 종류 */
export type PoiKind =
  | "convenience" // 편의점
  | "mart" // 마트
  | "cafe" // 카페
  | "pharmacy" // 약국
  | "hospital" // 병원
  | "subway" // 지하철역
  | "parking" // 주차장
  | "school" // 학교
  | "safety" // 안전기관(경찰/소방 등)
  | "culture" // 문화시설
  | "park"; // 공원

/** POI 한 점 */
export type PoiPoint = {
  id: string;
  kind: PoiKind;
  lat: number;
  lng: number;
  zIndex?: number;
};

/** (마커 API용) 아이콘 스펙 */
export type PoiIconSpec = {
  url: string;
  size: [number, number]; // [w, h]
  offset: [number, number]; // [x, y]
};
