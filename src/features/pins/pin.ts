export type PinOption = {
  hasAircon?: boolean;
  hasFridge?: boolean;
  hasWasher?: boolean;
  hasDryer?: boolean;
  hasBidet?: boolean;
  hasAirPurifier?: boolean;
  extraOptionsText?: string | null;
};

export type PinDirection = {
  direction: string; // "남향" 등
};

export type PinAreaGroup = {
  title?: string | null;
  exclusiveMinM2?: number | null;
  exclusiveMaxM2?: number | null;
  actualMinM2?: number | null;
  actualMaxM2?: number | null;
  sortOrder?: number | null;
};

export type PinUnit = {
  rooms?: number | null;
  baths?: number | null;
  hasLoft?: boolean | null;
  hasTerrace?: boolean | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  note?: string | null;
};

export type PinDetail = {
  id: string;
  lat: number;
  lng: number;

  addressLine?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;

  hasElevator?: boolean | null;

  contactMainLabel?: string | null;
  contactMainPhone?: string | null;
  contactSubLabel?: string | null;
  contactSubPhone?: string | null;

  name?: string | null; // 매물명 (검색/라벨용)
  badge?: string | null;

  options?: PinOption | null;
  directions?: PinDirection[] | null;
  areaGroups?: PinAreaGroup[] | null;
  units?: PinUnit[] | null;
};

/** 백엔드 공통 응답 래퍼 */
export type ApiEnvelope<T> = {
  success: boolean;
  path: string;
  data: T | null;
  statusCode?: number;
  messages?: string[];
};
