import type {
  CreatePayload,
  PropertyViewDetails,
} from "@/features/properties/types/property-domain";

const KEY = "app:properties";

function loadAll(): PropertyViewDetails[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAll(items: PropertyViewDetails[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function list(): PropertyViewDetails[] {
  return loadAll();
}

export function getById(id: string): PropertyViewDetails | undefined {
  return loadAll().find((x) => x.id === id);
}

export function create(payload: CreatePayload): PropertyViewDetails {
  const items = loadAll();
  const id = crypto.randomUUID();

  // 그대로 저장(orientations 포함). 필요한 파생 필드만 여기서 일괄 정리.
  const now = new Date().toISOString();
  const item: PropertyViewDetails = {
    id,
    title: payload.title,
    address: payload.address,
    status: payload.status,
    dealStatus: payload.dealStatus,

    // 주차/준공/면적 등 그대로
    parkingType: payload.parkingType,
    parkingGrade: payload.parkingGrade,
    completionDate: payload.completionDate,
    exclusiveArea: payload.exclusiveArea,
    realArea: payload.realArea,

    elevator: payload.elevator,
    options: payload.options,
    optionEtc: payload.optionEtc,
    registry: payload.registry,

    unitLines: payload.unitLines,
    images: payload.images,

    // 숫자들
    totalBuildings: payload.totalBuildings,
    totalFloors: payload.totalFloors,
    totalHouseholds: payload.totalHouseholds,
    remainingHouseholds: payload.remainingHouseholds,

    // 메모
    publicMemo: payload.publicMemo,
    secretMemo: payload.secretMemo,

    // 향: orientations + 레거시(있으면 같이 저장)
    orientations: payload.orientations,
    aspect: payload.aspect,
    aspectNo: payload.aspectNo,
    aspect1: payload.aspect1,
    aspect2: payload.aspect2,
    aspect3: payload.aspect3,

    // 메타
    createdByName: "me",
    createdAt: now,
    updatedByName: "me",
    updatedAt: now,
  };

  items.unshift(item);
  saveAll(items);
  return item;
}
