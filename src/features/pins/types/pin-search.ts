import { PinDetail } from "../pin";

export type PinSearchParams = {
  rooms?: number[];
  hasLoft?: boolean;
  hasTerrace?: boolean;
  hasElevator?: boolean;
  salePriceMin?: number;
  salePriceMax?: number;
  areaMinM2?: number;
  areaMaxM2?: number;
  buildingType?: "APT" | "OP" | "주택" | "도생" | "근생";
};

/** 필터 없이 요청할 때만 함께 반환되는 draft */
export type PinDraftLite = {
  id: string;
  lat: number;
  lng: number;
  addressLine: string;
  draftState: "BEFORE" | "SCHEDULED";
};

export type PinSearchResult = {
  pins: PinDetail[];
  drafts?: PinDraftLite[];
};
