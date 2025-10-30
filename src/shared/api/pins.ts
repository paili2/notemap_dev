import {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { api } from "./api";
import { ApiEnvelope } from "@/features/pins/pin";
import { buildSearchQuery } from "./utils/query";
import type { CreatePinAreaGroupDto } from "@/features/properties/types/area-group-dto";

/* ───────────── 로컬 좌표 디버그 유틸(외부 의존 제거) ───────────── */
function assertNoTruncate(tag: string, lat: number, lng: number) {
  const latStr = String(lat);
  const lngStr = String(lng);
  const latDec = latStr.split(".")[1]?.length ?? 0;
  const lngDec = lngStr.split(".")[1]?.length ?? 0;
  // eslint-disable-next-line no-console
  console.debug(`[coords-send:${tag}]`, {
    lat,
    lng,
    latStr,
    lngStr,
    latDecimals: latDec,
    lngDecimals: lngDec,
  });
  if (process.env.NODE_ENV !== "production") {
    if (latDec < 6 || lngDec < 6) {
      // eslint-disable-next-line no-console
      console.warn(`[coords-low-precision:${tag}] 소수 자릿수 부족`, {
        latStr,
        lngStr,
      });
    }
  }
}

/* ───────────── 유틸 ───────────── */
function makeIdempotencyKey() {
  try {
    if ((globalThis as any).crypto?.randomUUID)
      return (globalThis as any).crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** 해시(중복 방지)용 6자리 근사치. "전송"에는 절대 사용하지 않음. */
const round6 = (n: string | number) => {
  const v = Number(n);
  return Math.round(v * 1e6) / 1e6;
};
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

  /** 단지/주택 수 */
  totalHouseholds?: number | string | null;
  /** ✅ 총 개동(동 수) */
  totalBuildings?: number | string | null;
  /** ✅ 총 층수 */
  totalFloors?: number | string | null;
  /** ✅ 잔여 세대 */
  remainingHouseholds?: number | string | null;

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

  /** ✅ 최저 실입(정수 금액, 서버: number|null) */
  minRealMoveInCost?: number | string | null;
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
  data: {
    id: string | number;
    matchedDraftId: number | null;
    lat?: number;
    lng?: number;
  } | null;
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

/* directions sanitize: 문자열/객체 혼재 허용, 공백만 제거(중복/제한 없음) */
function sanitizeDirections(
  dirs?: Array<CreatePinDirectionDto | string>
): CreatePinDirectionDto[] | undefined {
  if (!Array.isArray(dirs) || dirs.length === 0) return undefined;

  const out = dirs
    .map((d) => {
      const label =
        typeof d === "string"
          ? d
          : typeof (d as any)?.direction === "string"
          ? (d as any).direction
          : "";
      const t = String(label ?? "");
      const normalized = t.trim();
      return normalized
        ? ({ direction: normalized } as CreatePinDirectionDto)
        : null;
    })
    .filter(Boolean) as CreatePinDirectionDto[];

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
      actualMinM2: actMin,
      actualMaxM2: actMax,
      sortOrder:
        Number.isFinite(Number(g.sortOrder)) && Number(g.sortOrder) >= 0
          ? Number(g.sortOrder)
          : idx,
    });
  });

  return out;
}

/* ───────────── 내부 헬퍼: 부분 좌표 PATCH 안전 검사 ───────────── */
function safeAssertNoTruncate(origin: string, lat?: any, lng?: any) {
  const latOk = Number.isFinite(Number(lat));
  const lngOk = Number.isFinite(Number(lng));
  if (latOk && lngOk) {
    assertNoTruncate(origin, Number(lat), Number(lng));
  }
}

/* ───────────── 핀 생성 (/pins) ───────────── */
export async function createPin(
  dto: CreatePinDto,
  signal?: AbortSignal
): Promise<{ id: string; matchedDraftId: number | null }> {
  // ✅ directions: 원형 보존(필요시 trim 추가 가능)
  const dirs = Array.isArray(dto.directions)
    ? dto.directions.map((d) =>
        typeof d === "string"
          ? { direction: d }
          : { direction: String((d as any)?.direction ?? "") }
      )
    : undefined;

  // ✅ areaGroups 정규화
  const groups = sanitizeAreaGroups(dto.areaGroups);

  // 디버그 로그
  // eslint-disable-next-line no-console
  console.log("[createPin][A] dto.directions:", dto.directions);
  // eslint-disable-next-line no-console
  console.log(
    "[createPin][B] payload.directions:]",
    Array.isArray(dirs) ? dirs.map((x) => x.direction) : dirs
  );

  // 동일 입력 빠른 연속 호출 흡수(좌표는 round6 근사) — 전송에는 사용하지 않음
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
    // 미리보기엔 굳이 단지 숫자 3종/최저실입은 안 넣어도 됨
  };
  const h = hashPayload(preview);
  if (G[KEY_HASH] === h && G[KEY_PROMISE]) return G[KEY_PROMISE];

  // ✅ 좌표 유효성 가드
  const latNum = Number(dto.lat);
  const lngNum = Number(dto.lng);
  if (!Number.isFinite(latNum))
    throw new Error("lat이 유효한 숫자가 아닙니다.");
  if (!Number.isFinite(lngNum))
    throw new Error("lng가 유효한 숫자가 아닙니다.");

  const payload = {
    lat: latNum, // 원본 정밀도 유지
    lng: lngNum,
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

    ...(typeof dto.completionDate === "string" &&
    dto.completionDate.trim() !== ""
      ? { completionDate: dto.completionDate }
      : {}),

    ...(dto.buildingType ? { buildingType: dto.buildingType } : {}),
    ...(dto.totalHouseholds != null
      ? { totalHouseholds: Number(dto.totalHouseholds) }
      : {}),

    /** ✅ 추가: 단지 숫자 3종 */
    ...(dto.totalBuildings != null
      ? { totalBuildings: Number(dto.totalBuildings) }
      : {}),
    ...(dto.totalFloors != null
      ? { totalFloors: Number(dto.totalFloors) }
      : {}),
    ...(dto.remainingHouseholds != null
      ? { remainingHouseholds: Number(dto.remainingHouseholds) }
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

    ...(dirs ? { directions: dirs } : {}),
    ...(groups ? { areaGroups: groups } : {}),

    /** ✅ 최저 실입(정수 금액) */
    ...(Object.prototype.hasOwnProperty.call(dto, "minRealMoveInCost")
      ? {
          minRealMoveInCost:
            dto.minRealMoveInCost === null
              ? null
              : Number(dto.minRealMoveInCost),
        }
      : {}),
  } as const;

  // 전송 직전 좌표 추적
  assertNoTruncate("createPin", payload.lat, payload.lng);

  // 단일비행 요청
  const request = api.post<CreatePinResponse>("/pins", payload, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "x-no-retry": "1",
      "Idempotency-Key": makeIdempotencyKey(),
    },
    maxRedirects: 0,
    signal,
    validateStatus: () => true,
  });
  G[KEY_HASH] = h;
  G[KEY_PROMISE] = request;

  try {
    const { data, status } = await request;

    if (status === 409) {
      throw new Error("중복 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
    }

    if (!data?.success || !data?.data?.id) {
      const msg = data?.messages?.join("\n") || data?.message || "핀 생성 실패";
      const e = new Error(msg) as any;
      e.responseData = data;
      throw e;
    }

    // 서버 좌표가 오면 비교
    const savedLat = (data as any)?.data?.lat;
    const savedLng = (data as any)?.data?.lng;
    if (
      typeof savedLat === "number" &&
      typeof savedLng === "number" &&
      (Math.abs(savedLat - payload.lat) > 1e-8 ||
        Math.abs(savedLng - payload.lng) > 1e-8)
    ) {
      // eslint-disable-next-line no-console
      console.warn("[coords-mismatch:createPin] server-truncated?", {
        sent: { lat: payload.lat, lng: payload.lng },
        saved: { lat: savedLat, lng: savedLng },
      });
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

  // directions: 전달되었을 때만
  let directionsPayload: CreatePinDirectionDto[] | undefined;
  if (has("directions")) {
    if (dto.directions === null) directionsPayload = [];
    else if (Array.isArray(dto.directions))
      directionsPayload = sanitizeDirections(dto.directions) ?? [];
  }

  // areaGroups: 전달되었을 때만
  let areaGroupsPayload: CreatePinAreaGroupDto[] | undefined;
  if (has("areaGroups")) {
    if (Array.isArray(dto.areaGroups)) {
      areaGroupsPayload = sanitizeAreaGroups(dto.areaGroups) ?? [];
    } else {
      areaGroupsPayload = []; // null 등 → 전체 삭제
    }
  }

  // units: 전달되었을 때만
  let unitsPayload: any[] | undefined;
  if (has("units")) {
    unitsPayload = Array.isArray(dto.units) ? dto.units : [];
  }

  // options: 객체면 sanitize, null이면 삭제
  let optionsPayload: CreatePinOptionsDto | null | undefined;
  if (has("options")) {
    optionsPayload =
      dto.options === null ? null : sanitizeOptions(dto.options ?? undefined);
  }

  const payload: any = {
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

    /** ✅ 추가: 단지 숫자 3종 */
    ...(has("totalBuildings")
      ? {
          totalBuildings:
            dto.totalBuildings == null ? null : Number(dto.totalBuildings),
        }
      : {}),
    ...(has("totalFloors")
      ? {
          totalFloors: dto.totalFloors == null ? null : Number(dto.totalFloors),
        }
      : {}),
    ...(has("remainingHouseholds")
      ? {
          remainingHouseholds:
            dto.remainingHouseholds == null
              ? null
              : Number(dto.remainingHouseholds),
        }
      : {}),

    ...(has("totalParkingSlots")
      ? {
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

    /** ✅ 최저 실입(정수 금액) PATCH 지원 */
    ...(has("minRealMoveInCost")
      ? {
          minRealMoveInCost:
            dto.minRealMoveInCost == null
              ? null
              : Number(dto.minRealMoveInCost),
        }
      : {}),
  };

  // 전송 직전 좌표 추적(있을 때만)
  safeAssertNoTruncate("updatePin", payload.lat, payload.lng);

  try {
    const { data, status } = await api.patch(
      `/pins/${encodeURIComponent(String(id))}`,
      payload,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "x-no-retry": "1",
        },
        signal,
        validateStatus: () => true,
      }
    );

    if (status === 404) {
      throw new Error("핀을 찾을 수 없습니다.");
    }
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
  data: { draftId: number; lat?: number; lng?: number } | null;
  statusCode?: number;
  messages?: string[];
};

export async function createPinDraft(
  dto: CreatePinDraftDto,
  signal?: AbortSignal
): Promise<{ id: string }> {
  const latNum = Number(dto.lat);
  const lngNum = Number(dto.lng);
  if (!Number.isFinite(latNum))
    throw new Error("lat이 유효한 숫자가 아닙니다.");
  if (!Number.isFinite(lngNum))
    throw new Error("lng가 유효한 숫자가 아닙니다.");

  const payload = {
    lat: latNum, // 원본 정밀도 유지
    lng: lngNum,
    addressLine: String(dto.addressLine ?? ""),
  };

  // 전송 직전 좌표 추적
  assertNoTruncate("createPinDraft", payload.lat, payload.lng);

  const request = api.post<CreatePinDraftResponse>("/pin-drafts", payload, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "x-no-retry": "1",
      "Idempotency-Key": makeIdempotencyKey(),
    },
    maxRedirects: 0,
    signal,
    validateStatus: () => true,
  });

  const { data, headers, status } = await request;

  if (status === 409) {
    throw new Error("중복 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
  }

  // 서버 좌표가 오면 비교
  const savedLat = (data as any)?.data?.lat;
  const savedLng = (data as any)?.data?.lng;
  if (
    typeof savedLat === "number" &&
    typeof savedLng === "number" &&
    (Math.abs(savedLat - payload.lat) > 1e-8 ||
      Math.abs(savedLng - payload.lng) > 1e-8)
  ) {
    // eslint-disable-next-line no-console
    console.warn("[coords-mismatch:createPinDraft] server-truncated?", {
      sent: { lat: payload.lat, lng: payload.lng },
      saved: { lat: savedLat, lng: savedLng },
    });
  }

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
