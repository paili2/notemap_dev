import {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { api } from "./api";
import { ApiEnvelope } from "@/features/pins/pin";
import { buildSearchQuery } from "./utils/query";
import { todayYmdKST } from "../date/todayYmdKST";

// ✅ 추가: 면적 그룹 DTO 임포트
import type { CreatePinAreaGroupDto } from "@/features/properties/types/area-group-dto";

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
// round6: 해시(중복 방지)용 근사치. "전송"에는 사용하지 않음.
const round6 = (n: number | string) => Number(Number(n).toFixed(6));
const isFiniteNum = (v: any) => Number.isFinite(Number(v));

/* ───────────── DTO (export!) ───────────── */
export type CreatePinOptionsDto = {
  hasAircon?: boolean;
  hasFridge?: boolean;
  hasWasher?: boolean;
  hasDryer?: boolean;
  hasBidet?: boolean;
  hasAirPurifier?: boolean;
  isDirectLease?: boolean;
  /** 최대 255자 */
  extraOptionsText?: string | null;
};

export type CreatePinDirectionDto = {
  direction: string;
};

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

  /** ✅ 총 주차대수 (0 허용) */
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

  /** ✅ 옵션 세트 */
  options?: CreatePinOptionsDto;

  /** ✅ 방향 목록 (문자/객체 모두 허용) */
  directions?: Array<CreatePinDirectionDto | string>;

  /** ✅ 면적 그룹 */
  areaGroups?: CreatePinAreaGroupDto[];
};

export type UpdatePinDto = Partial<CreatePinDto> & {
  /** options: 객체면 upsert, null이면 제거 */
  options?: CreatePinOptionsDto | null;

  /** 전달되면 전체 교체 (빈 배열도 허용), null이면 전부 삭제로 취급 */
  directions?: Array<CreatePinDirectionDto | string> | null;

  /** 전달되면 전체 교체 (빈 배열도 허용), null이면 전부 삭제로 취급 */
  areaGroups?: CreatePinAreaGroupDto[] | null;

  /** 전달되면 전체 교체 (빈 배열도 허용), null이면 전부 삭제로 취급 */
  units?: any[] | null;
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

/* 옵션 sanitize: boolean은 !!로, extraOptionsText는 255자로 제한 */
function sanitizeOptions(o?: CreatePinOptionsDto) {
  if (!o) return undefined;
  const clip255 = (s: any) => {
    const t = String(s ?? "").trim();
    return t ? t.slice(0, 255) : undefined;
  };
  const payload: any = {
    hasAircon: !!o.hasAircon,
    hasFridge: !!o.hasFridge,
    hasWasher: !!o.hasWasher,
    hasDryer: !!o.hasDryer,
    hasBidet: !!o.hasBidet,
    hasAirPurifier: !!o.hasAirPurifier,
    isDirectLease: !!o.isDirectLease,
  };
  const txt = clip255(o.extraOptionsText);
  if (txt !== undefined) payload.extraOptionsText = txt;
  return payload;
}

/* directions sanitize: 문자열/객체 혼재 허용, 공백/중복 제거 */
function sanitizeDirections(
  dirs?: Array<CreatePinDirectionDto | string>
): CreatePinDirectionDto[] | undefined {
  if (!Array.isArray(dirs) || dirs.length === 0) return undefined;
  const seen = new Set<string>();
  const out: CreatePinDirectionDto[] = [];
  for (const d of dirs) {
    const label =
      typeof d === "string"
        ? d
        : typeof (d as any)?.direction === "string"
        ? (d as any).direction
        : "";
    const t = label.trim();
    if (!t) continue;
    const key = t; // 한글 라벨 그대로 기준
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ direction: t });
  }
  return out.length ? out : undefined;
}

/* ✅ areaGroups sanitize: 전용 min/max는 필수, 실제 min/max는 없으면 전용값으로 대체 */
function sanitizeAreaGroups(
  list?: CreatePinAreaGroupDto[] | null
): CreatePinAreaGroupDto[] | undefined {
  if (!Array.isArray(list)) return undefined;

  const out: CreatePinAreaGroupDto[] = [];
  list.forEach((g, idx) => {
    if (!g) return;

    const title = String(g.title ?? "").trim();
    if (!title) return;

    // ▶ 전용(㎡) — 필수
    const exMin = Number(g.exclusiveMinM2);
    const exMax = Number(g.exclusiveMaxM2);
    if (!Number.isFinite(exMin) || !Number.isFinite(exMax)) return;
    if (exMin > exMax) return; // 역전 방지

    // ▶ 실제(㎡) — 필수 스펙: 없으면 전용값으로 대체
    const hasActMin =
      g.actualMinM2 != null && Number.isFinite(Number(g.actualMinM2));
    const hasActMax =
      g.actualMaxM2 != null && Number.isFinite(Number(g.actualMaxM2));

    const actMin = hasActMin ? Number(g.actualMinM2) : exMin;
    const actMax = hasActMax ? Number(g.actualMaxM2) : exMax;

    if (actMin > actMax) return; // 역전 방지

    out.push({
      title: title.slice(0, 50),
      exclusiveMinM2: exMin,
      exclusiveMaxM2: exMax,
      actualMinM2: actMin, // ✅ 항상 number
      actualMaxM2: actMax, // ✅ 항상 number
      sortOrder:
        Number.isFinite(Number(g.sortOrder)) && Number(g.sortOrder) >= 0
          ? Number(g.sortOrder)
          : idx,
    });
  });

  return out;
}

/* ───────────── 핀 생성 (/pins) ───────────── */
export async function createPin(
  dto: CreatePinDto,
  signal?: AbortSignal
): Promise<{ id: string; matchedDraftId: number | null }> {
  // ✅ directions 정규화
  const dirs = sanitizeDirections(dto.directions);
  // ✅ areaGroups 정규화
  const groups = sanitizeAreaGroups(dto.areaGroups);

  // 동일 입력 빠른 연속 호출 흡수 (좌표는 round6로 근사)
  const preview = {
    lat: round6(dto.lat),
    lng: round6(dto.lng),
    addressLine: String(dto.addressLine ?? ""),
    name: (dto.name ?? "").trim() || "임시 매물",
    pinDraftId:
      dto.pinDraftId == null || String(dto.pinDraftId) === ""
        ? undefined
        : Number(dto.pinDraftId),
    totalParkingSlots:
      dto.totalParkingSlots === 0 || dto.totalParkingSlots
        ? Number(dto.totalParkingSlots)
        : undefined,
    parkingTypeId:
      dto.parkingTypeId == null ? undefined : Number(dto.parkingTypeId),
    registrationTypeId:
      dto.registrationTypeId == null
        ? undefined
        : Number(dto.registrationTypeId),
    buildingType: dto.buildingType ?? undefined,
    options: dto.options
      ? {
          a: !!dto.options.hasAircon,
          f: !!dto.options.hasFridge,
          w: !!dto.options.hasWasher,
          d: !!dto.options.hasDryer,
          b: !!dto.options.hasBidet,
          p: !!dto.options.hasAirPurifier,
          l: !!dto.options.isDirectLease,
          x: (dto.options.extraOptionsText ?? "").trim().slice(0, 32),
        }
      : undefined,
    directionsLen: Array.isArray(dto.directions) ? dto.directions.length : 0,
    areaGroupsLen: Array.isArray(groups) ? groups.length : 0,
  };
  const h = hashPayload(preview);
  if (G[KEY_HASH] === h && G[KEY_PROMISE]) return G[KEY_PROMISE];

  const effectiveCompletionDate = resolveCompletionDate(dto.completionDate);

  const payload = {
    // 좌표는 원본 정밀도 그대로
    lat: Number(dto.lat),
    lng: Number(dto.lng),
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

    ...(dto.pinDraftId != null && String(dto.pinDraftId) !== ""
      ? { pinDraftId: Number(dto.pinDraftId) }
      : {}),

    completionDate: effectiveCompletionDate,
    ...(dto.buildingType ? { buildingType: dto.buildingType } : {}),
    ...(dto.totalHouseholds != null
      ? { totalHouseholds: Number(dto.totalHouseholds) }
      : {}),

    // ✅ 0도 전송되도록 null/undefined만 제외
    ...(dto.totalParkingSlots !== null && dto.totalParkingSlots !== undefined
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

    ...(dto.options ? { options: sanitizeOptions(dto.options) } : {}),

    // ✅ directions: [{direction:"…"}[]] 형태로만 전송
    ...(dirs ? { directions: dirs } : {}),

    // ✅ areaGroups: sanitize 후 전송
    ...(groups ? { areaGroups: groups } : {}),
  } as const;

  G[KEY_HASH] = h;

  try {
    const { data } = await api.post<CreatePinResponse>("/pins", payload, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "x-no-retry": "1",
        "Idempotency-Key": makeIdempotencyKey(),
      },
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
  } catch (err: any) {
    const resp = err?.response?.data;
    const msg =
      resp?.messages?.join("\n") ||
      resp?.message ||
      err?.message ||
      "요청 실패";
    const e = new Error(msg) as any;
    e.responseData = resp ?? err?.response;
    throw e;
  } finally {
    G[KEY_PROMISE] = null;
  }
}

export async function updatePin(
  id: string | number,
  dto: UpdatePinDto,
  signal?: AbortSignal
): Promise<{ id: string }> {
  const has = (k: keyof UpdatePinDto) =>
    Object.prototype.hasOwnProperty.call(dto, k);

  // directions: 전달되었을 때만 전송 (빈배열 허용, null -> 빈배열)
  let directionsPayload: CreatePinDirectionDto[] | undefined;
  if (has("directions")) {
    if (dto.directions === null) directionsPayload = [];
    else if (Array.isArray(dto.directions))
      directionsPayload = sanitizeDirections(dto.directions) ?? [];
  }

  // areaGroups: 전달되었을 때만 전송 (빈배열 허용, null -> 빈배열)
  let areaGroupsPayload: CreatePinAreaGroupDto[] | undefined;
  if (has("areaGroups")) {
    if (Array.isArray(dto.areaGroups)) {
      areaGroupsPayload = sanitizeAreaGroups(dto.areaGroups) ?? [];
    } else {
      areaGroupsPayload = []; // null 등 → 전체 삭제
    }
  }

  // units: 전달되었을 때만 전송 (빈배열 허용, null -> 빈배열)
  let unitsPayload: any[] | undefined;
  if (has("units")) {
    unitsPayload = Array.isArray(dto.units) ? dto.units : [];
  }

  // options: 객체면 sanitize, null이면 null 그대로(삭제)
  let optionsPayload: CreatePinOptionsDto | null | undefined;
  if (has("options")) {
    optionsPayload =
      dto.options === null ? null : sanitizeOptions(dto.options ?? undefined);
  }

  const payload: any = {
    // ✅ 좌표는 전달된 경우에만, 그리고 유효할 때만 전송 (Number.isFinite)
    ...(has("lat") && isFiniteNum(dto.lat)
      ? { lat: Number(dto.lat as any) }
      : {}),
    ...(has("lng") && isFiniteNum(dto.lng)
      ? { lng: Number(dto.lng as any) }
      : {}),

    ...(has("addressLine")
      ? { addressLine: String(dto.addressLine ?? "") }
      : {}),
    ...(has("name") ? { name: (dto.name ?? "").toString() } : {}),
    ...(has("badge") ? { badge: dto.badge ?? null } : {}),

    ...(has("contactMainLabel")
      ? { contactMainLabel: (dto.contactMainLabel ?? "").toString() }
      : {}),
    ...(has("contactMainPhone")
      ? { contactMainPhone: (dto.contactMainPhone ?? "").toString() }
      : {}),
    ...(has("contactSubLabel")
      ? { contactSubLabel: (dto.contactSubLabel ?? "").toString() }
      : {}),
    ...(has("contactSubPhone")
      ? { contactSubPhone: (dto.contactSubPhone ?? "").toString() }
      : {}),

    // ✅ PATCH에서 completionDate는 빈값이면 **전송하지 않음** (의도치 않은 덮어쓰기 방지)
    ...(has("completionDate")
      ? typeof dto.completionDate === "string" &&
        dto.completionDate.trim() !== ""
        ? { completionDate: dto.completionDate }
        : {}
      : {}),

    ...(has("buildingType") ? { buildingType: dto.buildingType ?? null } : {}),
    ...(has("totalHouseholds")
      ? {
          totalHouseholds:
            dto.totalHouseholds == null ? null : Number(dto.totalHouseholds),
        }
      : {}),

    ...(has("totalParkingSlots")
      ? {
          // 0 허용 / null이면 제거 의미
          totalParkingSlots:
            dto.totalParkingSlots === null
              ? null
              : Number(dto.totalParkingSlots as any),
        }
      : {}),

    ...(has("registrationTypeId")
      ? {
          registrationTypeId:
            dto.registrationTypeId == null
              ? null
              : Number(dto.registrationTypeId),
        }
      : {}),
    ...(has("parkingTypeId")
      ? {
          parkingTypeId:
            dto.parkingTypeId == null ? null : Number(dto.parkingTypeId),
        }
      : {}),
    ...(has("parkingGrade") ? { parkingGrade: dto.parkingGrade ?? null } : {}),
    ...(has("slopeGrade") ? { slopeGrade: dto.slopeGrade ?? null } : {}),
    ...(has("structureGrade")
      ? { structureGrade: dto.structureGrade ?? null }
      : {}),
    ...(has("publicMemo") ? { publicMemo: dto.publicMemo ?? null } : {}),
    ...(has("privateMemo") ? { privateMemo: dto.privateMemo ?? null } : {}),
    ...(has("isOld") ? { isOld: !!dto.isOld } : {}),
    ...(has("isNew") ? { isNew: !!dto.isNew } : {}),
    ...(has("hasElevator") ? { hasElevator: !!dto.hasElevator } : {}),

    ...(has("options") ? { options: optionsPayload } : {}),
    ...(has("directions") ? { directions: directionsPayload } : {}),
    ...(has("areaGroups") ? { areaGroups: areaGroupsPayload } : {}),
    ...(has("units") ? { units: unitsPayload } : {}),
  };

  try {
    const { data } = await api.patch(`/pins/${id}`, payload, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "x-no-retry": "1",
      },
      signal,
    });

    if (!data?.success || !data?.data?.id) {
      const msg = data?.messages?.join("\n") || data?.message || "핀 수정 실패";
      const e = new Error(msg) as any;
      e.responseData = data;
      throw e;
    }
    return { id: String(data.data.id) };
  } catch (err: any) {
    const resp = err?.response?.data;
    const msg =
      resp?.messages?.join("\n") ||
      resp?.message ||
      err?.message ||
      "요청 실패";
    const e = new Error(msg) as any;
    e.responseData = resp ?? err?.response;
    throw e;
  }
}

/* ───────────── 임시핀 (/pin-drafts) ───────────── */
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
    // ⛳ 임시핀도 전송은 원본 좌표 그대로(정밀도 보존)
    lat: Number(dto.lat),
    lng: Number(dto.lng),
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
