// src/features/properties/components/PropertyCreateModal/lib/buildCreatePayload.ts
"use client";

import { buildOrientationFields } from "@/features/properties/lib/orientation";
import { setPack } from "@/features/properties/lib/validators";
import type { CreatePayload } from "@/features/properties/types/property-dto";

import type {
  AspectRowLite,
  Grade,
  Registry,
  UnitLine,
} from "@/features/properties/types/property-domain";
import type {
  ImageItem,
  StoredMediaItem,
} from "@/features/properties/types/media";

import { AreaSet } from "../../sections/AreaSetsSection/types";
import { PinKind } from "@/features/pins/types";
import { todayYmdKST } from "@/shared/date/todayYmdKST";

/** 안전 숫자 변환 ("" | null | undefined → undefined) */
const toNum = (v: unknown) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

/** 정수 or null ("" | null | undefined → null, 숫자 문자열 허용, 정수화) */
const toIntOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/** 간단 문자열 sanitize */
const s = (v: unknown) => String(v ?? "").trim();

type BuildArgs = {
  title: string;
  address: string;
  officeName: string;
  officePhone: string;
  officePhone2: string;
  moveIn: string;
  floor: string;
  roomNo: string;
  structure: string;

  badge?: string | null;

  listingStars: number;
  parkingType: string | null;

  /** ✅ 신설: 총 주차 대수 (권장) */
  totalParkingSlots?: number | string | null;

  completionDate?: string; // optional
  salePrice: string;

  baseAreaSet: AreaSet;
  extraAreaSets: AreaSet[];

  elevator: "O" | "X";
  registryOne?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;

  totalBuildings: string;
  totalFloors: string;
  totalHouseholds: string;
  remainingHouseholds: string;

  /** 새 필드들 */
  buildingType?: string | null;
  registrationTypeId?: number | string | null;
  parkingTypeId?: number | string | null;

  options: string[];
  etcChecked: boolean;
  optionEtc: string;
  publicMemo: string;
  secretMemo: string;

  aspects: AspectRowLite[];
  unitLines: UnitLine[];

  imageFolders: ImageItem[][];
  fileItems: ImageItem[];

  pinKind: PinKind;

  /** ✅ 좌표 */
  lat?: number | null;
  lng?: number | null;

  /** draft */
  pinDraftId?: number | string | null;
};

export function buildCreatePayload(args: BuildArgs) {
  const {
    title,
    address,
    officeName,
    officePhone,
    officePhone2,
    moveIn,
    floor,
    roomNo,
    structure,

    badge,

    listingStars,
    parkingType,
    totalParkingSlots,
    completionDate,
    salePrice,
    baseAreaSet,
    extraAreaSets,
    elevator,
    registryOne,
    slopeGrade,
    structureGrade,
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,

    buildingType,
    registrationTypeId,
    parkingTypeId,

    options,
    etcChecked,
    optionEtc,
    publicMemo,
    secretMemo,
    aspects,
    unitLines,
    imageFolders,
    fileItems,

    /** ✅ 좌표 */
    lat,
    lng,

    pinKind,
  } = args;

  // completionDate fallback — 비어있으면 KST YYYY-MM-DD
  const effectiveCompletionDate = s(completionDate) || todayYmdKST();

  /* 1) 향/방향 필드 */
  const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
    buildOrientationFields(aspects);

  /* 2) 면적 패킹 */
  const exclusiveArea = setPack(
    baseAreaSet.exMinM2,
    baseAreaSet.exMaxM2,
    baseAreaSet.exMinPy,
    baseAreaSet.exMaxPy
  );
  const realArea = setPack(
    baseAreaSet.realMinM2,
    baseAreaSet.realMaxM2,
    baseAreaSet.realMinPy,
    baseAreaSet.realMaxPy
  );
  const extraExclusiveAreas = extraAreaSets.map((s0) =>
    setPack(s0.exMinM2, s0.exMaxM2, s0.exMinPy, s0.exMaxPy)
  );
  const extraRealAreas = extraAreaSets.map((s0) =>
    setPack(s0.realMinM2, s0.realMaxM2, s0.realMinPy, s0.realMaxPy)
  );

  const baseAreaTitle = (baseAreaSet.title ?? "").trim();
  const extraAreaTitles = extraAreaSets.map((s0) => (s0.title ?? "").trim());

  /* 3) 이미지 포맷 */
  const imageFoldersRaw: ImageItem[][] = imageFolders.map((card) =>
    card.map((i) => ({ ...i }))
  );
  const fileItemsRaw: ImageItem[] = fileItems.map((i) => ({ ...i }));

  const imageCardsUI: { url: string; name: string; caption?: string }[][] =
    imageFolders.map((card) =>
      card
        .filter((it) => !!it.url)
        .map(({ url, name, caption }) => ({
          url: url as string,
          name: name ?? "",
          ...(caption ? { caption } : {}),
        }))
    );

  const imageFoldersStored: StoredMediaItem[][] = imageFolders.map((card) =>
    card.map(({ idbKey, url, name, caption }) => ({
      ...(idbKey ? { idbKey } : {}),
      ...(url ? { url } : {}),
      ...(name ? { name } : {}),
      ...(caption ? { caption } : {}),
    }))
  );

  const imagesFlatStrings: string[] = imageFolders
    .flat()
    .map((f) => f.url)
    .filter(Boolean) as string[];

  const imageCardCounts = imageFolders.map((card) => card.length);

  const verticalImagesStored: StoredMediaItem[] = fileItems.map((f) => ({
    ...(f.idbKey ? { idbKey: f.idbKey } : {}),
    ...(f.url ? { url: f.url } : {}),
    ...(f.name ? { name: f.name } : {}),
    ...(f.caption ? { caption: f.caption } : {}),
  }));

  const verticalImagesUI: {
    url: string;
    name: string;
    caption?: string;
    idbKey?: string;
  }[] = fileItems
    .filter((f) => !!f.url)
    .map((f) => ({
      url: f.url as string,
      name: f.name ?? "",
      ...(f.caption ? { caption: f.caption } : {}),
      ...(f.idbKey ? { idbKey: f.idbKey } : {}),
    }));

  /* 4) 최종 payload */
  const safeBadge = s(badge);

  const normalizedTotalParkingSlots = toIntOrNull(totalParkingSlots);

  const payload: CreatePayload & {
    imageFolders: StoredMediaItem[][];
    imageCards: Array<Array<{ url: string; name: string; caption?: string }>>;
    imageCardCounts: number[];
    verticalImages: StoredMediaItem[];
    images: string[];
    fileItems?: Array<{
      url: string;
      name: string;
      caption?: string;
      idbKey?: string;
    }>;
    extraExclusiveAreas: string[];
    extraRealAreas: string[];
    baseAreaTitle?: string;
    extraAreaTitles?: string[];
    areaSetTitle?: string;
    areaSetTitles?: string[];
    pinKind?: PinKind;
    imageFoldersRaw: ImageItem[][];
    fileItemsRaw: ImageItem[];
    pinDraftId?: number | string | null;

    /** ✅ 좌표 pass-through (필요 시 /pins 매핑에서 사용) */
    lat?: number;
    lng?: number;
  } = {
    /* 기본 */
    title,

    address,
    officeName,
    officePhone,
    officePhone2,
    moveIn,
    floor,
    roomNo,
    structure,

    contactMainLabel: officeName?.trim() || "문의",
    contactMainPhone: officePhone,
    ...(officePhone2 && officePhone2.trim() !== ""
      ? {
          contactSubLabel: officeName?.trim() || "사무실",
          contactSubPhone: officePhone2,
        }
      : {}),

    ...(safeBadge ? { badge: safeBadge.slice(0, 30) } : {}),

    aspect,
    aspectNo,
    ...(aspect1 ? { aspect1 } : {}),
    ...(aspect2 ? { aspect2 } : {}),
    ...(aspect3 ? { aspect3 } : {}),
    orientations,

    salePrice,
    ...(parkingType != null && String(parkingType).trim() !== ""
      ? { parkingType: String(parkingType) }
      : {}),

    ...(normalizedTotalParkingSlots === null
      ? {}
      : { totalParkingSlots: normalizedTotalParkingSlots }),

    // YYYY-MM-DD, KST
    completionDate: effectiveCompletionDate,

    exclusiveArea,
    realArea,
    listingStars,
    elevator,

    // 숫자 변환 적용
    ...(toNum(totalBuildings) !== undefined
      ? { totalBuildings: toNum(totalBuildings)! }
      : {}),
    ...(toNum(totalFloors) !== undefined
      ? { totalFloors: toNum(totalFloors)! }
      : {}),
    ...(toNum(totalHouseholds) !== undefined
      ? { totalHouseholds: toNum(totalHouseholds)! }
      : {}),
    ...(toNum(remainingHouseholds) !== undefined
      ? { remainingHouseholds: toNum(remainingHouseholds)! }
      : {}),

    slopeGrade,
    structureGrade,
    options,
    optionEtc: etcChecked ? s(optionEtc) : "",
    publicMemo,
    secretMemo, // ✅ 메인 키
    privateMemo: secretMemo, // ✅ 레거시 호환도 함께 전송
    registry: registryOne,

    unitLines,

    imageFolders: imageFoldersStored,
    imageCards: imageCardsUI,
    imageCardCounts,
    verticalImages: verticalImagesStored,
    images: imagesFlatStrings,
    fileItems: verticalImagesUI,
    imageFoldersRaw,
    fileItemsRaw,

    extraExclusiveAreas,
    extraRealAreas,
    pinKind,

    baseAreaTitle,
    extraAreaTitles,
    areaSetTitle: baseAreaTitle,
    areaSetTitles: extraAreaTitles,

    ...(s(buildingType) ? { buildingType: s(buildingType) } : {}),
    ...(toNum(registrationTypeId) !== undefined
      ? { registrationTypeId: toNum(registrationTypeId)! }
      : {}),
    ...(toNum(parkingTypeId) !== undefined
      ? { parkingTypeId: toNum(parkingTypeId)! }
      : {}),

    /** ✅ 좌표 전달 (숫자인 경우에만 포함) */
    ...(typeof lat === "number" ? { lat } : {}),
    ...(typeof lng === "number" ? { lng } : {}),

    pinDraftId: args.pinDraftId ?? null,
  };

  return payload;
}
