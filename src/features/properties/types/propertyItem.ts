import { LatLng } from "./map";
import { DealStatus, PropertyViewDetails, Visibility } from "./property-domain";

export type PropertyItem = {
  id: string;
  title: string;
  status?: Visibility; // 게시상태
  dealStatus?: DealStatus; // 거래상태  ⬅️ 추가
  priceText?: string;
  type?: "아파트" | "오피스텔" | "상가" | "사무실" | "토지" | string;
  address?: string;
  position: LatLng;
  tags?: string[];
  favorite?: boolean;
  updatedAt?: string;
  view?: Partial<PropertyViewDetails>;
};
