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
  safeAssertNoTruncate,
} from "../utils";
import type { UpdatePinDto } from "../types";
import type { CreatePinOptionsDto } from "@/features/properties/types/property-dto";

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

  // directions
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

  // areaGroups
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
      areaGroupsPayload = [];
    }
    if (DEV) {
      console.groupCollapsed("[updatePin] areaGroups(after sanitize)]");
      console.log("areaGroupsPayload =", areaGroupsPayload);
      console.groupEnd();
    }
  }

  // units
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

  // options
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

  // parkingGrade
  const pg = has("parkingGrade")
    ? normalizeParkingGradeStr(
        (dto as any)?.parkingGrade,
        (dto as any)?.propertyGrade
      )
    : undefined;
  if (DEV && has("parkingGrade")) {
    console.log("[updatePin] parkingGrade normalized:", pg);
  }

  // buildingType
  let buildingTypePayload: any = {};
  if (has("buildingType")) {
    if (dto.buildingType === null) {
      buildingTypePayload = { buildingType: null };
    } else if (dto.buildingType !== undefined) {
      const mapped = toServerBuildingType(dto.buildingType);
      if (mapped) buildingTypePayload = { buildingType: mapped };
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

  if (DEV) {
    console.groupCollapsed("[updatePin] payload(before prune)");
    console.log("has('areaGroups') =", has("areaGroups"));
    console.log("payload.areaGroups =", (payload as any).areaGroups);
    console.log(payload);
    console.groupEnd();
  }

  const pruned = deepPrune(payload);

  if (DEV) {
    console.groupCollapsed("[updatePin] payload(after prune) - final request]");
    console.log(pruned);
    console.groupEnd();
  }

  if (isEmpty(pruned)) {
    if (DEV) {
      console.debug("[updatePin] skip empty patch", { id, payload });
    }
    return { id: String(id) };
  }

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
