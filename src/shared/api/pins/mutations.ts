import type { AxiosRequestConfig } from "axios";
import { api } from "../api";
import type { ApiEnvelope } from "@/features/pins/pin";
import type { PinKind } from "@/features/pins/types";
import { mapPinKindToBadge } from "@/features/properties/lib/badge";
import {
  DEV,
  assertNoTruncate,
  makeIdempotencyKey,
  round6,
  isFiniteNum,
  normalizeParkingGradeStr,
  toServerBuildingType,
  deepPrune,
  isEmpty,
  sanitizeOptions,
  sanitizeDirections,
  sanitizeAreaGroups,
  sanitizeUnits,
  safeAssertNoTruncate,
  coercePinDraftId,
} from "./utils";
import type {
  CreatePinDto,
  UpdatePinDto,
  CreatePinDraftDto,
  DeletePinRes,
} from "./types";
import { CreatePinOptionsDto } from "@/features/properties/types/property-dto";

/* createPin 응답 타입 */
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

    // ✅ parkingType 문자열 전송
    ...(dto.parkingType != null && String(dto.parkingType).trim() !== ""
      ? { parkingType: String(dto.parkingType).trim() }
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

    /** ✅ 리베이트 텍스트(최대 50자) */
    ...(Object.prototype.hasOwnProperty.call(dto, "rebateText")
      ? {
          rebateText:
            dto.rebateText == null
              ? null
              : String(dto.rebateText).trim().slice(0, 50),
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

/* ───────────── 핀 수정 (/pins/:id, PATCH) ───────────── */
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
  let directionsPayload: ReturnType<typeof sanitizeDirections> | undefined;
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
  let areaGroupsPayload: ReturnType<typeof sanitizeAreaGroups> | undefined;
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
  let unitsPayload: ReturnType<typeof sanitizeUnits> | undefined;
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

    // ✅ parkingType 문자열 PATCH
    ...(has("parkingType")
      ? {
          parkingType:
            dto.parkingType == null ? null : String(dto.parkingType).trim(),
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

    /** ✅ 리베이트 텍스트 PATCH 지원 */
    ...(has("rebateText")
      ? {
          rebateText:
            dto.rebateText == null
              ? null
              : String(dto.rebateText).trim().slice(0, 50),
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

/* ───────────── 핀 삭제 (/pins/:id, DELETE) ───────────── */

/** [DELETE] /pins/:id — 핀 완전 삭제 */
export async function deletePin(
  id: string | number,
  config?: AxiosRequestConfig
): Promise<DeletePinRes> {
  const { data } = await api.delete<
    ApiEnvelope<{ id: string | number } | null>
  >(`/pins/${encodeURIComponent(String(id))}`, {
    withCredentials: true,
    ...(config ?? {}),
  });

  if (!data?.success) {
    const single = (data as any)?.message as string | undefined;
    const msg =
      (Array.isArray(data?.messages) && data!.messages!.join("\n")) ||
      single ||
      "핀 삭제에 실패했습니다.";
    const e = new Error(msg) as any;
    e.responseData = data;
    throw e;
  }

  const resId = (data.data as any)?.id ?? id;
  return { id: String(resId) };
}

/**
 * ⚠️ 레거시 호환용:
 *  - 예전 코드가 togglePinDisabled(id, true)를 호출해도
 *    내부에서는 DELETE /pins/:id 로 동작하게 유지
 */
export async function togglePinDisabled(
  id: string | number,
  isDisabled: boolean,
  config?: AxiosRequestConfig
): Promise<DeletePinRes> {
  if (!isDisabled) {
    // 복구 기능은 아직 없으니까 방어적으로 막아둠
    throw new Error("핀 복구 API는 아직 지원하지 않습니다.");
  }
  return deletePin(id, config);
}

/* ───────────── 임시핀 (/pin-drafts) ───────────── */

type CreatePinDraftResponse = {
  success: boolean;
  path: string;
  message?: string;
  data: {
    draftId?: number;
    id?: number;
    pinDraftId?: number;
    pin_draft_id?: number;
    lat?: number;
    lng?: number;
  } | null;
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

  // ✅ 다양한 키(draftId / id / pinDraftId / pin_draft_id) 대응
  let draftId: string | number | undefined =
    data?.data?.draftId ??
    data?.data?.id ??
    (data?.data as any)?.pinDraftId ??
    (data?.data as any)?.pin_draft_id ??
    undefined;

  // Location 헤더 fallback
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
