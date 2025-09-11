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
import type { ImageItem } from "@/features/properties/types/media";

import { AreaSet } from "../../sections/AreaSetsSection/types";
import { PinKind } from "@/features/pins/types";

type BuildArgs = {
  // 기본
  title: string;
  address: string;
  officeName: string;
  officePhone: string;
  officePhone2: string;
  moveIn: string;
  floor: string;
  roomNo: string;
  structure: string;
  // 매물평점/주차/준공/매매가
  listingStars: number;
  parkingType: string;
  parkingCount: string;
  completionDate: string;
  salePrice: string;
  // 면적
  baseAreaSet: AreaSet;
  extraAreaSets: AreaSet[];
  // 등기/등급
  elevator: "O" | "X";
  registryOne?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;
  // 숫자
  totalBuildings: string;
  totalFloors: string;
  totalHouseholds: string;
  remainingHouseholds: string;
  // 옵션/메모
  options: string[];
  etcChecked: boolean;
  optionEtc: string;
  publicMemo: string;
  secretMemo: string;
  // 향/유닛
  aspects: AspectRowLite[];
  unitLines: UnitLine[];
  // 이미지
  imageFolders: ImageItem[][];
  fileItems: ImageItem[];
  // 기타
  pinKind: PinKind;
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
    listingStars,
    parkingType,
    parkingCount,
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
    options,
    etcChecked,
    optionEtc,
    publicMemo,
    secretMemo,
    aspects,
    unitLines,
    imageFolders,
    fileItems,
    pinKind,
  } = args;

  // 1) 향/방향 필드
  const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
    buildOrientationFields(aspects);

  // 2) 면적 패킹
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
  const extraExclusiveAreas = extraAreaSets.map((s) =>
    setPack(s.exMinM2, s.exMaxM2, s.exMinPy, s.exMaxPy)
  );
  const extraRealAreas = extraAreaSets.map((s) =>
    setPack(s.realMinM2, s.realMaxM2, s.realMinPy, s.realMaxPy)
  );

  const baseAreaTitle = (baseAreaSet.title ?? "").trim();
  const extraAreaTitles = extraAreaSets.map((s) => (s.title ?? "").trim());

  // 3) 이미지 포맷 (UI용/스토리지용)
  const imageCardsUI = imageFolders.map((card) =>
    card.map(({ url, name, caption }) => ({
      url,
      name,
      ...(caption ? { caption } : {}),
    }))
  );

  const imageFoldersStored = imageFolders.map((card) =>
    card.map(({ idbKey, url, name, caption }) =>
      idbKey
        ? { idbKey, name, ...(caption ? { caption } : {}) }
        : { url, name, ...(caption ? { caption } : {}) }
    )
  );

  const imagesFlatStrings: string[] = imageFolders.flat().map((f) => f.url);
  const imageCardCounts = imageFolders.map((card) => card.length);

  const verticalImagesStored = fileItems.map((f) =>
    f.idbKey
      ? {
          idbKey: f.idbKey,
          name: f.name,
          ...(f.caption ? { caption: f.caption } : {}),
        }
      : {
          url: f.url,
          name: f.name,
          ...(f.caption ? { caption: f.caption } : {}),
        }
  );
  const verticalImagesUI = fileItems.map((f) => ({
    url: f.url,
    name: f.name,
    ...(f.caption ? { caption: f.caption } : {}),
    ...(f.idbKey ? { idbKey: f.idbKey } : {}),
  }));

  // 4) 최종 payload
  const payload: CreatePayload & {
    imageFolders: Array<
      Array<{ idbKey?: string; url?: string; name?: string; caption?: string }>
    >;
    imagesByCard: Array<Array<{ url: string; name: string; caption?: string }>>;
    imageCards: Array<Array<{ url: string; name: string; caption?: string }>>;
    imageCardCounts: number[];
    verticalImages: Array<{
      idbKey?: string;
      url?: string;
      name?: string;
      caption?: string;
    }>;
    images: string[];
    fileItems?: Array<{
      idbKey?: string;
      url?: string;
      name?: string;
      caption?: string;
    }>;
    extraExclusiveAreas: string[];
    extraRealAreas: string[];
    baseAreaTitle?: string;
    extraAreaTitles?: string[];
    areaSetTitle?: string;
    areaSetTitles?: string[];
    pinKind?: PinKind;
  } = {
    title,
    address,
    officeName,
    officePhone,
    officePhone2,
    moveIn,
    floor,
    roomNo,
    structure,
    aspect,
    aspectNo,
    ...(aspect1 ? { aspect1 } : {}),
    ...(aspect2 ? { aspect2 } : {}),
    ...(aspect3 ? { aspect3 } : {}),
    orientations,
    salePrice,
    parkingType,
    parkingCount,
    completionDate,
    exclusiveArea,
    realArea,
    listingStars,
    elevator,
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,
    slopeGrade,
    structureGrade,
    options,
    optionEtc: etcChecked ? optionEtc.trim() : "",
    publicMemo,
    secretMemo,
    registry: registryOne,
    unitLines,

    imageFolders: imageFoldersStored,
    imagesByCard: imageCardsUI, // ⚠️ (레거시 호환) 당장은 유지
    imageCards: imageCardsUI, // ⚠️ (레거시 호환) 당장은 유지
    imageCardCounts,
    verticalImages: verticalImagesStored,

    images: imagesFlatStrings,
    fileItems: verticalImagesUI,

    extraExclusiveAreas,
    extraRealAreas,

    pinKind,

    // AreaSet 제목들
    baseAreaTitle,
    extraAreaTitles,

    // (레거시 호환 키)
    areaSetTitle: baseAreaTitle,
    areaSetTitles: extraAreaTitles,
  };

  return payload;
}
