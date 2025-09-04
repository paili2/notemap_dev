import type { LatLng } from "../../map/types/map";
import type { Registry, Grade } from "./property-domain";
import { PropertyViewDetails } from "../components/PropertyViewModal/property-view";

/**
 * 목록/지도에서 쓰는 경량 아이템.
 * - 상세 모달에서 필요한 무거운 데이터는 `view`에 부분적으로 캐시.
 */
export type PropertyItem = {
  id: string;

  // 기본
  title: string;
  address?: string;

  // 카테고리(예: "아파트", "주택" 등)
  type?: string;

  // 지도 위치 (마커 필수)
  position: LatLng;

  // 요약/배지
  priceText?: string | number; // 리스트 카드에서 쓰는 요약가
  elevator?: "O" | "X";
  parkingGrade?: Grade;
  registry?: Registry;

  // 즐겨찾기 등 UI 상태
  favorite?: boolean;

  // 썸네일 등 (선택)
  images?: string[];

  // 상세 보기용 데이터 일부를 캐시(부분적이어도 OK)
  view?: Partial<PropertyViewDetails>;
};
