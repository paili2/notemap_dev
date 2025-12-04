import { api } from "../../api";
import {
  DEV,
  isFiniteNum,
  normalizeParkingGradeStr,
  toServerBuildingType,
  deepPrune,
  isEmpty,
  sanitizeOptions,
  sanitizeDirections,
  sanitizeAreaGroups,
  sanitizeUnits,
} from "../utils";
import type { UpdatePinDto } from "../types";
import type { CreatePinOptionsDto } from "@/features/properties/types/property-dto";

export async function updatePin(
  id: string | number,
  dto: UpdatePinDto,
  signal?: AbortSignal
): Promise<{ id: string }> {
  const has = (k: keyof UpdatePinDto) =>
    Object.prototype.hasOwnProperty.call(dto, k);

  // directions
  let directionsPayload: ReturnType<typeof sanitizeDirections> | undefined;
  if (has("directions")) {
    if (dto.directions === null) directionsPayload = [];
    else if (Array.isArray(dto.directions))
      directionsPayload = sanitizeDirections(dto.directions) ?? [];
  }

  // areaGroups
  let areaGroupsPayload: ReturnType<typeof sanitizeAreaGroups> | undefined;
  if (has("areaGroups")) {
    if (Array.isArray(dto.areaGroups)) {
      areaGroupsPayload = sanitizeAreaGroups(dto.areaGroups) ?? [];
    } else {
      areaGroupsPayload = [];
    }
  }

  // units
  let unitsPayload: ReturnType<typeof sanitizeUnits> | undefined;
  if (has("units")) {
    unitsPayload =
      dto.units === null ? [] : sanitizeUnits(dto.units ?? []) ?? [];
  }

  // options
  let optionsPayload: CreatePinOptionsDto | null | undefined;
  if (has("options")) {
    optionsPayload =
      dto.options === null ? null : sanitizeOptions(dto.options ?? undefined);
  }

  // parkingGrade
  const pg = has("parkingGrade")
    ? normalizeParkingGradeStr(
        (dto as any)?.parkingGrade,
        (dto as any)?.propertyGrade
      )
    : undefined;

  // buildingType
  let buildingTypePayload: any = {};
  if (has("buildingType")) {
    if (dto.buildingType === null) {
      buildingTypePayload = { buildingType: null };
    } else if (dto.buildingType !== undefined) {
      const mapped = toServerBuildingType(dto.buildingType);
      if (mapped) buildingTypePayload = { buildingType: mapped };
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

    ...(has("parkingType")
      ? {
          parkingType:
            dto.parkingType == null ? null : String(dto.parkingType).trim(),
        }
      : {}),

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

    ...(has("isOld") ? { isOld: !!dto.isOld } : {}),
    ...(has("isNew") ? { isNew: !!dto.isNew } : {}),

    ...(has("hasElevator") ? { hasElevator: !!dto.hasElevator } : {}),

    ...(has("options") ? { options: optionsPayload } : {}),
    ...(has("directions") ? { directions: directionsPayload } : {}),
    ...(has("areaGroups") ? { areaGroups: areaGroupsPayload } : {}),
    ...(has("units") ? { units: unitsPayload } : {}),

    ...(has("minRealMoveInCost")
      ? {
          minRealMoveInCost:
            dto.minRealMoveInCost == null
              ? null
              : Number(dto.minRealMoveInCost),
        }
      : {}),

    ...(has("rebateText")
      ? {
          rebateText:
            dto.rebateText == null
              ? null
              : String(dto.rebateText).trim().slice(0, 50),
        }
      : {}),
  };

  const pruned = deepPrune(payload);

  if (isEmpty(pruned)) {
    return { id: String(id) };
  }

  try {
    const { data, status } = await api.patch(
      `/pins/${encodeURIComponent(String(id))}`,
      pruned,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
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
