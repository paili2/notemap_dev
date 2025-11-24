import {
  PinSearchParams,
  PinSearchResult,
} from "@/features/pins/types/pin-search";
import { api } from "./api";
import { ApiEnvelope } from "@/features/pins/pin";
import { buildSearchQuery } from "./utils/query";
import type { CreatePinAreaGroupDto } from "@/features/properties/types/area-group-dto";
import type { PinKind } from "@/features/pins/types";
import { mapPinKindToBadge } from "@/features/properties/lib/badge";
import type { AxiosRequestConfig } from "axios";

/* 개발환경 플래그 */
const DEV = process.env.NODE_ENV !== "production";

/* ───────────── 로컬 좌표 디버그 유틸(외부 의존 제거) ───────────── */
function assertNoTruncate(tag: string, lat: number, lng: number) {
  const latStr = String(lat);
  const lngStr = String(lng);
  const latDec = latStr.split(".")[1]?.length ?? 0;
  const lngDec = lngStr.split(".")[1]?.length ?? 0;
  if (DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[coords-send:${tag}]`, {
      lat,
      lng,
      latStr,
      lngStr,
      latDecimals: latDec,
      lngDecimals: lngDec,
    });
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

/* 숫자 정규화: 정수 또는 null */
const toIntOrNull = (v: any): number | null => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/* 🔐 parkingGrade 정규화(문자열로 보냄): 1~5 → "1".."5", null 유지, 그 외는 undefined(필드 제외) */
function normalizeParkingGradeStr(
  v: unknown,
  fallback?: unknown
): string | null | undefined {
  const src = v ?? fallback;
  if (src === null) return null;
  const s = String(src ?? "").trim();
  if (!s) return undefined; // ← 빈 문자열/공백은 필드 제외
  const n = Number(s);
  if (Number.isInteger(n) && n >= 1 && n <= 5) return String(n);
  return undefined;
}

/* ✅ UI 등기/용도 → 서버 허용값 강제 변환
 *  - 도/생(도시형생활주택 계열) → "도생"
 *  - 근/생(근린생활시설 계열) → "근생"
 */
function toServerBuildingType(
  v: any
): "APT" | "OP" | "주택" | "도생" | "근생" | undefined {
  if (v == null) return undefined;

  const raw = String(v).trim();
  if (!raw) return undefined;

  const s = raw.toLowerCase();

  // APT
  if (["apt", "아파트"].includes(s)) return "APT";

  // OP
  if (["op", "officetel", "오피스텔", "오피스텔형"].includes(s)) return "OP";

  // 주택
  if (["house", "housing", "주택", "residential"].includes(s)) return "주택";

  // ✅ 도/생(도시형생활주택 계열) → "도생"
  if (
    ["도생", "도/생", "도시생활형", "도시생활형주택", "urban", "urb"].includes(
      s
    )
  )
    return "도생";

  // ✅ 근생(근린생활시설 계열) → "근생"
  if (
    [
      "근생",
      "근/생",
      "near",
      "nearlife",
      "근린생활시설",
      "commercial",
    ].includes(s)
  )
    return "근생";

  // 이미 서버 enum 문자열로 들어온 경우(raw 그대로 비교)
  if (["APT", "OP", "주택", "도생", "근생"].includes(raw)) {
    return raw as "APT" | "OP" | "주택" | "도생" | "근생";
  }

  return undefined;
}

/* ───────────── 빈 PATCH 방지 헬퍼 ───────────── */
function deepPrune<T>(obj: T): Partial<T> {
  const prune = (v: any): any => {
    if (v === undefined) return undefined;
    if (Array.isArray(v)) {
      const arr = v.map(prune).filter((x) => x !== undefined);
      return arr.length ? arr : undefined;
    }
    if (v && typeof v === "object") {
      const out: Record<string, any> = {};
      for (const [k, vv] of Object.entries(v)) {
        const pv = prune(vv);
        if (pv !== undefined) out[k] = pv;
      }
      return Object.keys(out).length ? out : undefined;
    }
    return v;
  };
  return (prune(obj) ?? {}) as Partial<T>;
}
function isEmpty(obj: object | null | undefined) {
  return !obj || Object.keys(obj).length === 0;
}

/* ───────────── DTO (export!) ───────────── */
export type CreatePinOptionsDto = {
  hasAircon?: boolean;
  hasFridge?: boolean;
  hasWasher?: boolean;
  hasDryer?: boolean;
  hasBidet?: boolean;
  hasAirPurifier?: boolean;
  /** 최대 255자 */
  extraOptionsText?: string | null;
};

export type CreatePinDirectionDto = {
  direction: string;
};

/** 구조별 입력(units) 아이템 */
export type UnitsItemDto = {
  rooms?: number | null;
  baths?: number | null;
  hasLoft?: boolean | null;
  hasTerrace?: boolean | null;
  minPrice?: number | null;
  maxPrice?: number | null;
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

  /** 프론트 전용 라벨 (서버에는 보내지 않음) */
  parkingType?: string | null;

  /** ✅ 서버 전달 시 "1"~"5" 문자열 또는 null 권장 (입력은 number|string|null 수용) */
  parkingGrade?: number | string | null;

  slopeGrade?: string | null;
  structureGrade?: string | null;

  /** 서버 배지(내부 pinKind → mapPinKindToBadge로 변환 가능) */
  badge?: string | null;

  publicMemo?: string | null;
  privateMemo?: string | null;

  // ✅ 신축/구옥 (camelCase만 사용)
  isOld?: boolean;
  isNew?: boolean;

  hasElevator?: boolean;

  /** ✅ 옵션 세트 */
  options?: CreatePinOptionsDto;

  /** ✅ 방향 목록 (문자/객체 모두 허용) */
  directions?: Array<CreatePinDirectionDto | string>;

  /** ✅ 면적 그룹 */
  areaGroups?: CreatePinAreaGroupDto[] | null;

  /** ✅ 구조별 입력 (배열) */
  units?: UnitsItemDto[] | null;

  /** ✅ 최저 실입(정수 금액, 서버: number|null) */
  minRealMoveInCost?: number | string | null;

  pinKind?: PinKind | null;
};

export type UpdatePinDto = Partial<CreatePinDto> & {
  /** options: 객체면 upsert, null이면 제거 */
  options?: CreatePinOptionsDto | null;

  /** 전달되면 전체 교체 (빈 배열도 허용), null이면 전부 삭제로 취급 */
  directions?: Array<CreatePinDirectionDto | string> | null;

  /** 전달되면 전체 교체 (빈 배열도 허용), null이면 전부 삭제로 취급 */
  areaGroups?: CreatePinAreaGroupDto[] | null;

  /** 전달되면 전체 교체 (빈 배열도 허용), null이면 전부 삭제로 취급 */
  units?: UnitsItemDto[] | null;
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

/* ✅ units sanitize: 정수/boolean 캐스팅 + 음수 0 가드, 빈배열 → [] */
function sanitizeUnits(
  list?: UnitsItemDto[] | null
): UnitsItemDto[] | undefined {
  if (!Array.isArray(list)) return undefined;

  const nz = (n: number | null) => (n != null && n < 0 ? 0 : n);

  const mapped = list.map((u) => ({
    rooms: nz(toIntOrNull(u?.rooms)),
    baths: nz(toIntOrNull(u?.baths)),
    hasLoft: !!u?.hasLoft,
    hasTerrace: !!u?.hasTerrace,
    minPrice: nz(toIntOrNull(u?.minPrice)),
    maxPrice: nz(toIntOrNull(u?.maxPrice)),
  }));

  return mapped;
}

/* ───────────── 내부 헬퍼: 부분 좌표 PATCH 안전 검사 ───────────── */
function safeAssertNoTruncate(origin: string, lat?: any, lng?: any) {
  const latOk = Number.isFinite(Number(lat));
  const lngOk = Number.isFinite(Number(lng));
  if (latOk && lngOk) {
    assertNoTruncate(origin, Number(lat), Number(lng));
  }
}

/* 🔹 export: draft id 보정 유틸 */
export function coercePinDraftId(v: any): number | undefined {
  if (v == null || String(v) === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ───────────── 핀 생성 (/pins) ───────────── */
export async function createPin(
  dto: CreatePinDto,
  signal?: AbortSignal
): Promise<{ id: string; matchedDraftId: number | null }> {
  if (DEV) {
    console.groupCollapsed("[createPin] start dto");
    console.log(dto);
    console.log("→ isNew/isOld:", dto.isNew, dto.isOld);
    console.groupEnd();
  }

  // ✅ directions: sanitizeDirections로 일관 처리
  const dirs = sanitizeDirections(dto.directions);
  if (DEV) {
    console.groupCollapsed("[createPin] directions sanitize");
    console.log("raw =", dto.directions);
    console.log("sanitized =", dirs);
    console.groupEnd();
  }

  // ✅ areaGroups 정규화
  const groups = sanitizeAreaGroups(dto.areaGroups);
  if (DEV) {
    console.groupCollapsed("[createPin] areaGroups sanitize");
    console.log("raw =", dto.areaGroups);
    console.log("sanitized =", groups);
    console.groupEnd();
  }

  // ✅ units 정규화
  const units = sanitizeUnits(dto.units);
  if (DEV) {
    console.groupCollapsed("[createPin] units sanitize");
    console.log("raw =", dto.units);
    console.log("sanitized =", units);
    console.groupEnd();
  }

  // ✅ parkingGrade: 문자열로 정규화
  const pg = normalizeParkingGradeStr(
    (dto as any)?.parkingGrade,
    (dto as any)?.propertyGrade // ← 등록 폼이 다른 키를 쓸 가능성 대비
  );
  if (DEV) {
    console.log("[createPin] parkingGrade normalized:", pg);
  }

  // ✅ badge 자동 해석
  const pinKind: PinKind | undefined =
    (dto as any)?.pinKind != null
      ? ((dto as any).pinKind as PinKind)
      : undefined;
  const resolvedBadge =
    (dto.badge ?? null) ||
    (pinKind ? mapPinKindToBadge(pinKind) ?? null : null);

  // 동일 입력 빠른 연속 호출 흡수(좌표는 round6 근사) — 전송에는 사용하지 않음
  const preview = {
    lat: round6(dto.lat),
    lng: round6(dto.lng),
    addressLine: String(dto.addressLine ?? ""),
    name: (dto.name ?? "").trim() || "임시 매물",
    pinDraftId: coercePinDraftId(dto.pinDraftId),
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
          x: (dto.options.extraOptionsText ?? "").trim().slice(0, 32),
        }
      : undefined,
    directionsLen: Array.isArray(dirs) ? dirs.length : 0,
    areaGroupsLen: Array.isArray(groups) ? groups.length : 0,
    badge: resolvedBadge ?? undefined,
    unitsLen: Array.isArray(units) ? units.length : 0,
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

  // ✅ buildingType 최종 매핑
  let buildingTypePayload:
    | { buildingType: "APT" | "OP" | "주택" | "도생" | "근생" }
    | {} = {};
  if (dto.buildingType !== undefined && dto.buildingType !== null) {
    const mapped = toServerBuildingType(dto.buildingType);
    if (mapped) buildingTypePayload = { buildingType: mapped };
    // 생성에서는 매핑 실패 시 simply omit (검증 에러 회피)
  }

  const payload = {
    lat: latNum,
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

    ...(coercePinDraftId(dto.pinDraftId) !== undefined
      ? { pinDraftId: coercePinDraftId(dto.pinDraftId)! }
      : {}),

    ...(typeof dto.completionDate === "string" &&
    dto.completionDate.trim() !== ""
      ? { completionDate: dto.completionDate }
      : {}),

    ...buildingTypePayload,

    ...(dto.totalHouseholds != null
      ? { totalHouseholds: Number(dto.totalHouseholds) }
      : {}),

    // 단지 숫자 3종
    ...(dto.totalBuildings != null
      ? { totalBuildings: Number(dto.totalBuildings) }
      : {}),
    ...(dto.totalFloors != null
      ? { totalFloors: Number(dto.totalFloors) }
      : {}),
    ...(dto.remainingHouseholds != null
      ? { remainingHouseholds: Number(dto.remainingHouseholds) }
      : {}),

    // 총 주차대수(0도 허용)
    ...(dto.totalParkingSlots !== null && dto.totalParkingSlots !== undefined
      ? { totalParkingSlots: Number(dto.totalParkingSlots) }
      : {}),

    ...(dto.registrationTypeId != null
      ? { registrationTypeId: Number(dto.registrationTypeId) }
      : {}),
    ...(dto.parkingTypeId != null
      ? { parkingTypeId: Number(dto.parkingTypeId) }
      : {}),

    /** ✅ parkingGrade: 문자열 또는 null만 전송 */
    ...(pg === null
      ? { parkingGrade: null }
      : pg !== undefined
      ? { parkingGrade: pg }
      : {}),

    ...(dto.slopeGrade ? { slopeGrade: dto.slopeGrade } : {}),
    ...(dto.structureGrade ? { structureGrade: dto.structureGrade } : {}),

    // badge
    ...(resolvedBadge ? { badge: resolvedBadge } : {}),

    ...(dto.publicMemo ? { publicMemo: dto.publicMemo } : {}),
    ...(dto.privateMemo ? { privateMemo: dto.privateMemo } : {}),

    // ✅ 신축/구옥(camleCase만 전송)
    ...(typeof dto.isOld === "boolean" ? { isOld: dto.isOld } : {}),
    ...(typeof dto.isNew === "boolean" ? { isNew: dto.isNew } : {}),

    ...(typeof dto.hasElevator === "boolean"
      ? { hasElevator: dto.hasElevator }
      : {}),

    ...(dto.options ? { options: sanitizeOptions(dto.options) } : {}),

    ...(dirs ? { directions: dirs } : {}),
    ...(groups ? { areaGroups: groups } : {}),

    /** ✅ 구조별 입력 */
    ...(Array.isArray(units) ? { units } : {}),

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

  if (DEV) {
    console.groupCollapsed("[createPin] final payload");
    console.log(payload);
    console.groupEnd();
  }

  assertNoTruncate("createPin", payload.lat, payload.lng);

  const request = api.post<CreatePinResponse>("/pins", payload, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      // "x-no-retry": "1",
      // "Idempotency-Key": makeIdempotencyKey(),
    },
    maxRedirects: 0,
    signal,
    validateStatus: () => true,
  });
  G[KEY_HASH] = h;
  G[KEY_PROMISE] = request;

  try {
    const { data, status } = await request;

    if (DEV) {
      console.groupCollapsed("[createPin] response");
      console.log("status:", status);
      console.log("data:", data);
      console.groupEnd();
    }

    if (status === 409) {
      throw new Error("중복 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
    }

    if (!data?.success || !data?.data?.id) {
      const msg = data?.messages?.join("\n") || data?.message || "핀 생성 실패";
      const e = new Error(msg) as any;
      e.responseData = data;
      throw e;
    }

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
  if (DEV) {
    console.groupCollapsed("[updatePin] start dto");
    console.log("id =", id);
    console.log(dto);
    console.log("→ isNew/isOld:", dto.isNew, dto.isOld);
    console.groupEnd();
  }

  const has = (k: keyof UpdatePinDto) =>
    Object.prototype.hasOwnProperty.call(dto, k);

  // directions: 전달되었을 때만
  let directionsPayload: CreatePinDirectionDto[] | undefined;
  if (has("directions")) {
    if (DEV) {
      console.groupCollapsed("[updatePin] directions(raw in dto)]");
      console.log("dto.directions =", dto.directions);
      console.groupEnd();
    }
    if (dto.directions === null) directionsPayload = [];
    else if (Array.isArray(dto.directions))
      directionsPayload = sanitizeDirections(dto.directions) ?? [];
    if (DEV) {
      console.groupCollapsed("[updatePin] directions(after sanitize)]");
      console.log("directionsPayload =", directionsPayload);
      console.groupEnd();
    }
  }

  // areaGroups: 전달되었을 때만
  let areaGroupsPayload: CreatePinAreaGroupDto[] | undefined;
  if (has("areaGroups")) {
    if (DEV) {
      console.groupCollapsed("[updatePin] areaGroups(raw in dto)]");
      console.log("dto.areaGroups =", dto.areaGroups);
      console.groupEnd();
    }
    if (Array.isArray(dto.areaGroups)) {
      areaGroupsPayload = sanitizeAreaGroups(dto.areaGroups) ?? [];
    } else {
      areaGroupsPayload = []; // null 등 → 전체 삭제
    }
    if (DEV) {
      console.groupCollapsed("[updatePin] areaGroups(after sanitize)]");
      console.log("areaGroupsPayload =", areaGroupsPayload);
      console.groupEnd();
    }
  }

  // units: 전달되었을 때만 (sanitize)
  let unitsPayload: UnitsItemDto[] | undefined;
  if (has("units")) {
    if (DEV) {
      console.groupCollapsed("[updatePin] units(raw in dto)]");
      console.log("dto.units =", dto.units);
      console.groupEnd();
    }
    unitsPayload =
      dto.units === null ? [] : sanitizeUnits(dto.units ?? []) ?? [];
    if (DEV) {
      console.groupCollapsed("[updatePin] units(after sanitize)]");
      console.log("unitsPayload =", unitsPayload);
      console.groupEnd();
    }
  }

  // options: 객체면 sanitize, null이면 삭제
  let optionsPayload: CreatePinOptionsDto | null | undefined;
  if (has("options")) {
    if (DEV) {
      console.groupCollapsed("[updatePin] options(raw in dto)]");
      console.log("dto.options =", dto.options);
      console.groupEnd();
    }
    optionsPayload =
      dto.options === null ? null : sanitizeOptions(dto.options ?? undefined);
    if (DEV) {
      console.groupCollapsed("[updatePin] options(after sanitize)]");
      console.log("optionsPayload =", optionsPayload);
      console.groupEnd();
    }
  }

  // ✅ update에서도 parkingGrade를 문자열로 정규화
  const pg = has("parkingGrade")
    ? normalizeParkingGradeStr(
        (dto as any)?.parkingGrade,
        (dto as any)?.propertyGrade
      )
    : undefined;
  if (DEV && has("parkingGrade")) {
    console.log("[updatePin] parkingGrade normalized:", pg);
  }

  // ✅ buildingType 최종 매핑 + null 지원
  let buildingTypePayload: any = {};
  if (has("buildingType")) {
    if (dto.buildingType === null) {
      buildingTypePayload = { buildingType: null };
    } else if (dto.buildingType !== undefined) {
      const mapped = toServerBuildingType(dto.buildingType);
      if (mapped) buildingTypePayload = { buildingType: mapped };
      // 매핑 실패 시 필드 제외(검증 에러 회피)
    }
    if (DEV) {
      console.log("[updatePin] buildingTypePayload:", buildingTypePayload);
    }
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

    ...buildingTypePayload,

    ...(has("totalHouseholds")
      ? {
          totalHouseholds:
            dto.totalHouseholds == null ? null : Number(dto.totalHouseholds),
        }
      : {}),

    // 단지 숫자 3종
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

    /** ✅ parkingGrade: 정규화 결과(문자열/null)만 전송 */
    ...(has("parkingGrade") && pg !== undefined
      ? pg === null
        ? { parkingGrade: null }
        : { parkingGrade: pg }
      : {}),

    ...(has("slopeGrade") ? { slopeGrade: dto.slopeGrade ?? null } : {}),
    ...(has("structureGrade")
      ? { structureGrade: dto.structureGrade ?? null }
      : {}),
    ...(has("publicMemo") ? { publicMemo: dto.publicMemo ?? null } : {}),
    ...(has("privateMemo") ? { privateMemo: dto.privateMemo ?? null } : {}),

    // ✅ 신축/구옥: camelCase만 업데이트
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

  if (DEV) {
    console.groupCollapsed("[updatePin] payload(before prune)");
    console.log("has('areaGroups') =", has("areaGroups"));
    console.log("payload.areaGroups =", (payload as any).areaGroups);
    console.log(payload);
    console.groupEnd();
  }

  // 🔒 최종 방어선: 빈 payload면 요청 자체를 막음
  const pruned = deepPrune(payload);

  if (DEV) {
    console.groupCollapsed("[updatePin] payload(after prune) - final request]");
    console.log(pruned);
    console.groupEnd();
  }

  if (isEmpty(pruned)) {
    if (DEV) {
      // eslint-disable-next-line no-console
      console.debug("[updatePin] skip empty patch", { id, payload });
    }
    // 서버 상태 변동은 없지만, 호출자 로직을 단순히 하기 위해 id만 돌려줌
    return { id: String(id) };
  }

  // 전송 직전 좌표 추적(있을 때만)
  safeAssertNoTruncate("updatePin", (pruned as any).lat, (pruned as any).lng);

  if (DEV) {
    console.groupCollapsed("[updatePin] PATCH request");
    console.log("url:", `/pins/${encodeURIComponent(String(id))}`);
    console.log("body:", pruned);
    console.groupEnd();
  }

  try {
    const { data, status } = await api.patch(
      `/pins/${encodeURIComponent(String(id))}`,
      pruned,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          // "x-no-retry": "1",
        },
        signal,
        validateStatus: () => true,
      }
    );

    if (DEV) {
      console.groupCollapsed("[updatePin] response]");
      console.log("status:", status);
      console.log("data:", data);
      console.groupEnd();
    }

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

/* ───────────── 핀 비활성/활성 (/pins/disable/:id) ───────────── */
export type ToggleDisableDto = { isDisabled: boolean };
export type ToggleDisableRes = {
  id: string;
  isDisabled: boolean;
  changed: boolean;
};

/** [PATCH] /pins/disable/:id — 핀 활성/비활성 변경 */
export async function togglePinDisabled(
  id: string | number,
  isDisabled: boolean,
  config?: AxiosRequestConfig
): Promise<ToggleDisableRes> {
  const { data } = await api.patch<ApiEnvelope<ToggleDisableRes>>(
    `/pins/disable/${encodeURIComponent(String(id))}`,
    { isDisabled } satisfies ToggleDisableDto,
    { withCredentials: true, ...(config ?? {}) }
  );

  if (!data?.success || !data?.data) {
    const single = (data as any)?.message as string | undefined;
    const msg =
      (Array.isArray(data?.messages) && data!.messages!.join("\n")) ||
      single ||
      "상태 변경 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return data.data;
}

/* ───────────── 임시핀 (/pin-drafts) ───────────── */
export type CreatePinDraftDto = {
  lat: number | string;
  lng: number | string;
  addressLine: string | null | undefined;
  name?: string | null;

  /** 분양사무실 전화번호 */
  contactMainPhone?: string | null;
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
    lat: latNum,
    lng: lngNum,
    addressLine: String(dto.addressLine ?? ""),

    // ✅ 매물명: 값이 있을 때만 전송
    ...(dto.name != null && String(dto.name).trim() !== ""
      ? { name: String(dto.name).trim() }
      : {}),

    // ✅ 분양사무실 전화번호: 값이 있을 때만 전송
    ...(dto.contactMainPhone != null &&
    String(dto.contactMainPhone).trim() !== ""
      ? { contactMainPhone: String(dto.contactMainPhone).trim() }
      : {}),
  };

  assertNoTruncate("createPinDraft", payload.lat, payload.lng);

  if (DEV) {
    console.groupCollapsed("[createPinDraft] payload");
    console.log(payload);
    console.groupEnd();
  }

  const request = api.post<CreatePinDraftResponse>("/pin-drafts", payload, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      // "x-no-retry": "1",
      // "Idempotency-Key": makeIdempotencyKey(),
    },
    maxRedirects: 0,
    signal,
    validateStatus: () => true,
  });

  const { data, headers, status } = await request;

  if (DEV) {
    console.groupCollapsed("[createPinDraft] response");
    console.log("status:", status);
    console.log("data:", data);
    console.groupEnd();
  }

  if (status === 409) {
    throw new Error("중복 요청이 감지되었습니다. 잠시 후 다시 시도해주세요.");
  }

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
      const m = loc.match(/\/pin-drafts\/(\d+)(?:$|[\/?#])/);
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
    { withCredentials: true }
  );

  if (!data?.success || !data?.data) {
    const msg = data?.messages?.join("\n") || "핀 검색 실패";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }
  return data.data;
}
