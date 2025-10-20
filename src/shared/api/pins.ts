import { api } from "./api";

/* ───────────── 실제 핀 생성 (POST /pins) ───────────── */
export type CreatePinDto = {
  lat: number | string;
  lng: number | string;
  addressLine: string | null | undefined;
  name?: string | null;
  // 서버 DTO에서 필수로 요구됨
  contactMainLabel?: string | null;
  contactMainPhone?: string | null;

  // 선택 필드들: 서버가 받도록 열어두고 싶다면 여기에 추가
  completionDate?: string | null;
  buildingType?: string | null;
  totalHouseholds?: number | string | null;
  totalParkingSlots?: number | string | null;
  registrationTypeId?: number | string | null;
  parkingTypeId?: number | string | null;
  parkingGrade?: string | null;
  slopeGrade?: string | null;
  structureGrade?: string | null;
  badge?: string | null;
  publicMemo?: string | null;
  privateMemo?: string | null;
  isOld?: boolean;
  isNew?: boolean;
  hasElevator?: boolean;
};

export type CreatePinResponse = {
  success: boolean;
  path: string;
  message?: string;
  data: { id: string | number; matchedDraftId: number | null } | null;
  statusCode?: number;
  messages?: string[];
};

export async function createPin(
  dto: CreatePinDto,
  signal?: AbortSignal
): Promise<{ id: string; matchedDraftId: number | null }> {
  // 안전 변환 + 기본값(빈값 방지)
  const payload = {
    lat: Number(dto.lat),
    lng: Number(dto.lng),
    addressLine: String(dto.addressLine ?? ""),
    name: (dto.name ?? "").trim() || "임시 매물",

    // 연락처(문자열 강제 + trim + 기본값)
    contactMainLabel: (dto.contactMainLabel ?? "").toString().trim() || "대표",
    contactMainPhone:
      (dto.contactMainPhone ?? "").toString().trim() || "010-0000-0000",

    // 선택 필드들(있을 때만 포함)
    ...(dto.completionDate ? { completionDate: dto.completionDate } : {}),
    ...(dto.buildingType ? { buildingType: dto.buildingType } : {}),
    ...(dto.totalHouseholds != null
      ? { totalHouseholds: Number(dto.totalHouseholds) }
      : {}),
    ...(dto.totalParkingSlots != null
      ? { totalParkingSlots: Number(dto.totalParkingSlots) }
      : {}),
    ...(dto.registrationTypeId != null
      ? { registrationTypeId: Number(dto.registrationTypeId) }
      : {}),
    ...(dto.parkingTypeId != null
      ? { parkingTypeId: Number(dto.parkingTypeId) }
      : {}),
    ...(dto.parkingGrade ? { parkingGrade: dto.parkingGrade } : {}),
    ...(dto.slopeGrade ? { slopeGrade: dto.slopeGrade } : {}),
    ...(dto.structureGrade ? { structureGrade: dto.structureGrade } : {}),
    ...(dto.badge ? { badge: dto.badge } : {}),
    ...(dto.publicMemo ? { publicMemo: dto.publicMemo } : {}),
    ...(dto.privateMemo ? { privateMemo: dto.privateMemo } : {}),
    ...(typeof dto.isOld === "boolean" ? { isOld: dto.isOld } : {}),
    ...(typeof dto.isNew === "boolean" ? { isNew: dto.isNew } : {}),
    ...(typeof dto.hasElevator === "boolean"
      ? { hasElevator: dto.hasElevator }
      : {}),
  } as const;

  const { data } = await api.post<CreatePinResponse>("/pins", payload, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    maxRedirects: 0,
    signal,
  });

  if (!data?.success || !data?.data?.id) {
    const msg = data?.messages?.join("\n") || data?.message || "핀 생성 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return {
    id: String(data.data.id),
    matchedDraftId: data.data.matchedDraftId,
  };
}

/* ───────────── 임시핀 생성 (POST /pin-drafts) ───────────── */
export type CreatePinDraftDto = {
  lat: number | string;
  lng: number | string;
  addressLine: string | null | undefined;
};

export type CreatePinDraftResponse = {
  success: boolean;
  path: string;
  message?: string;
  data: { draftId: number } | null;
  statusCode?: number;
  messages?: string[];
};

export async function createPinDraft(
  dto: CreatePinDraftDto,
  signal?: AbortSignal
): Promise<{ id: string }> {
  const payload = {
    lat: Number(dto.lat),
    lng: Number(dto.lng),
    addressLine: String(dto.addressLine ?? ""),
  };

  const { data, headers } = await api.post<CreatePinDraftResponse>(
    "/pin-drafts",
    payload,
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
      maxRedirects: 0,
      signal,
    }
  );

  let draftId: string | number | undefined = data?.data?.draftId ?? undefined;

  // 일부 서버는 body 없이 Location 헤더만 반환할 수 있음 → /pin-drafts/123
  if (draftId == null) {
    const loc = headers?.location || (headers as any)?.Location;
    if (typeof loc === "string") {
      const m = loc.match(/\/pin-drafts\/(\d+)(?:$|[/?#])/);
      if (m) draftId = m[1];
    }
  }

  if (draftId == null || draftId === "") {
    const msg =
      data?.messages?.join("\n") || data?.message || "임시핀 생성 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }

  return { id: String(draftId) };
}
