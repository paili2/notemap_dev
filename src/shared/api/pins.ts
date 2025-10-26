// src/shared/api/pins.ts
import {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { api } from "./api";
import { ApiEnvelope } from "@/features/pins/pin";
import { buildSearchQuery } from "./utils/query";
import { todayYmdKST } from "../date/todayYmdKST";

/* ───────────── 유틸 ───────────── */
function resolveCompletionDate(input?: string | null): string {
  if (typeof input === "string" && input.trim() !== "") return input;
  return todayYmdKST();
}
function makeIdempotencyKey() {
  try {
    if ((globalThis as any).crypto?.randomUUID)
      return (globalThis as any).crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
const round6 = (n: number | string) => Number(Number(n).toFixed(6));

/* ───────────── DTO (export!) ───────────── */
export type CreatePinDto = {
  lat: number | string;
  lng: number | string;
  addressLine: string | null | undefined;
  name?: string | null;
  contactMainLabel?: string | null;
  contactMainPhone?: string | null;
  contactSubLabel?: string | null;
  contactSubPhone?: string | null;

  // 🔹 임시핀과의 명시적 매칭용 (선택)
  pinDraftId?: number | string | null;

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

type CreatePinResponse = {
  success: boolean;
  path: string;
  message?: string;
  data: { id: string | number; matchedDraftId: number | null } | null;
  statusCode?: number;
  messages?: string[];
};

/* ───────────── 전역(singleton) 단일비행 가드 ───────────── */
const G = (typeof window !== "undefined" ? window : globalThis) as any;
const KEY_PROMISE = "__PIN_CREATE_INFLIGHT_PROMISE__";
const KEY_HASH = "__PIN_CREATE_LAST_HASH__";
const hashPayload = (p: unknown) => {
  try {
    return JSON.stringify(p);
  } catch {
    return String(p);
  }
};

export async function createPin(
  dto: CreatePinDto,
  signal?: AbortSignal
): Promise<{ id: string; matchedDraftId: number | null }> {
  // 동일 입력 빠른 연속 호출 흡수
  const preview = {
    lat: round6(dto.lat),
    lng: round6(dto.lng),
    addressLine: String(dto.addressLine ?? ""),
    name: (dto.name ?? "").trim() || "임시 매물",
    pinDraftId:
      dto.pinDraftId == null || String(dto.pinDraftId) === ""
        ? undefined
        : Number(dto.pinDraftId),
  };
  const h = hashPayload(preview);
  if (G[KEY_HASH] === h && G[KEY_PROMISE]) return G[KEY_PROMISE];

  const effectiveCompletionDate = resolveCompletionDate(dto.completionDate);

  const payload = {
    // 🔹 좌표는 6자리 고정으로 전송(백 매칭 규칙과 정합)
    lat: round6(dto.lat),
    lng: round6(dto.lng),
    addressLine: String(dto.addressLine ?? ""),
    name: (dto.name ?? "").trim() || "임시 매물",

    contactMainLabel: (dto.contactMainLabel ?? "").toString().trim() || "대표",
    contactMainPhone:
      (dto.contactMainPhone ?? "").toString().trim() || "010-0000-0000",

    ...(dto.contactSubLabel != null && String(dto.contactSubLabel).trim() !== ""
      ? { contactSubLabel: String(dto.contactSubLabel).trim() }
      : {}),
    ...(dto.contactSubPhone != null && String(dto.contactSubPhone).trim() !== ""
      ? { contactSubPhone: String(dto.contactSubPhone).trim() }
      : {}),

    // 🔹 임시핀-매물 명시 매칭
    ...(dto.pinDraftId != null && String(dto.pinDraftId) !== ""
      ? { pinDraftId: Number(dto.pinDraftId) }
      : {}),

    // 선택 필드
    completionDate: effectiveCompletionDate, // "YYYY-MM-DD"
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

  G[KEY_HASH] = h;
  G[KEY_PROMISE] = api
    .post<CreatePinResponse>("/pins", payload, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "x-no-retry": "1",
        "Idempotency-Key": makeIdempotencyKey(),
      },
      maxRedirects: 0,
      signal,
    })
    .then(({ data }) => {
      if (!data?.success || !data?.data?.id) {
        const msg =
          data?.messages?.join("\n") || data?.message || "핀 생성 실패";
        const e = new Error(msg) as any;
        e.responseData = data;
        throw e;
      }
      return {
        id: String(data.data.id),
        matchedDraftId: data.data.matchedDraftId,
      };
    })
    .finally(() => {
      G[KEY_PROMISE] = null;
    });

  return G[KEY_PROMISE];
}

/* ───────────── 임시핀 ───────────── */
export type CreatePinDraftDto = {
  lat: number | string;
  lng: number | string;
  addressLine: string | null | undefined;
};
type CreatePinDraftResponse = {
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
    // 프론트에서 생성하는 임시핀도 동일하게 6자리 반올림(정합성)
    lat: round6(dto.lat),
    lng: round6(dto.lng),
    addressLine: String(dto.addressLine ?? ""),
  };
  const { data, headers } = await api.post<CreatePinDraftResponse>(
    "/pin-drafts",
    payload,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "x-no-retry": "1",
        "Idempotency-Key": makeIdempotencyKey(),
      },
      maxRedirects: 0,
      signal,
    }
  );

  let draftId: string | number | undefined = data?.data?.draftId ?? undefined;
  if (draftId == null) {
    const loc = (headers as any)?.location || (headers as any)?.Location;
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

/* ───────────── 핀 검색 (/pins/search) ───────────── */
export async function searchPins(
  params: PinSearchParams
): Promise<PinSearchResult> {
  const qs = buildSearchQuery(params);
  const { data } = await api.get<ApiEnvelope<PinSearchResult>>(
    `/pins/search${qs ? `?${qs}` : ""}`,
    { withCredentials: true, headers: { "x-no-retry": "1" } }
  );

  if (!data?.success || !data?.data) {
    const msg = data?.messages?.join("\n") || "핀 검색 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return data.data;
}
