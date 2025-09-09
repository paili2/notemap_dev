"use client";

import type { CreatePayload } from "@/features/properties/types/property-dto";

import type {
  AspectRowLite,
  Grade,
  Registry,
  UnitLine,
} from "@/features/properties/types/property-domain";
import type { ImageItem } from "@/features/properties/types/media";
import type { PinKind } from "@/features/map/pins";
import { AreaSet } from "../../sections/AreaSetsSection/types";

type BuildEditArgs = {
  id: string;

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

  // 평점/주차/준공/매매
  listingStars: number;
  parkingType: string;
  parkingCount: string;
  completionDate: string;
  salePrice: string;

  // 면적
  baseAreaSet: AreaSet;
  extraAreaSets: AreaSet[];
  exclusiveArea: string;
  realArea: string;
  extraExclusiveAreas: string[];
  extraRealAreas: string[];
  baseAreaTitleOut: string;
  extraAreaTitlesOut: string[];

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
  orientations: ReturnType<
    typeof import("@/features/properties/lib/orientation").buildOrientationFields
  >["orientations"];
  aspect: string;
  aspectNo: number;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  unitLines: UnitLine[];

  // 이미지
  imageFolders: ImageItem[][];
  verticalImages: ImageItem[];

  // 기타
  pinKind: PinKind;
};

export function buildEditPayload(a: BuildEditArgs) {
  // 이미지 포맷 (UI / 저장용)
  const imageCardsUI = a.imageFolders.map((card) =>
    card.map(({ url, name, caption }) => ({
      url,
      name,
      ...(caption ? { caption } : {}),
    }))
  );
  const imageFoldersStored = a.imageFolders.map((card) =>
    card.map(({ idbKey, url, name, caption }) =>
      idbKey
        ? { idbKey, name, ...(caption ? { caption } : {}) }
        : { url, name, ...(caption ? { caption } : {}) }
    )
  );
  const imagesFlatStrings: string[] = a.imageFolders.flat().map((f) => f.url);
  const imageCardCounts = a.imageFolders.map((card) => card.length);

  const verticalImagesStored = a.verticalImages.map((f) =>
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
  const verticalImagesUI = a.verticalImages.map((f) => ({
    url: f.url,
    name: f.name,
    ...(f.caption ? { caption: f.caption } : {}),
    ...(f.idbKey ? { idbKey: f.idbKey } : {}),
  }));

  const payload = {
    id: a.id,
    listingStars: a.listingStars,
    title: a.title,
    address: a.address,
    officeName: a.officeName,
    officePhone: a.officePhone,
    officePhone2: a.officePhone2,
    moveIn: a.moveIn,
    floor: a.floor,
    roomNo: a.roomNo,
    structure: a.structure,

    aspect: a.aspect,
    aspectNo: a.aspectNo,
    ...(a.aspect1 ? { aspect1: a.aspect1 } : {}),
    ...(a.aspect2 ? { aspect2: a.aspect2 } : {}),
    ...(a.aspect3 ? { aspect3: a.aspect3 } : {}),
    orientations: a.orientations,

    salePrice: a.salePrice,
    parkingType: a.parkingType,
    parkingCount: a.parkingCount,
    completionDate: a.completionDate,

    exclusiveArea: a.exclusiveArea,
    realArea: a.realArea,

    elevator: a.elevator,
    totalBuildings: a.totalBuildings,
    totalFloors: a.totalFloors,
    totalHouseholds: a.totalHouseholds,
    remainingHouseholds: a.remainingHouseholds,
    slopeGrade: a.slopeGrade,
    structureGrade: a.structureGrade,

    options: a.options,
    optionEtc: a.etcChecked ? a.optionEtc.trim() : "",
    publicMemo: a.publicMemo,
    secretMemo: a.secretMemo,
    registry: a.registryOne,
    unitLines: a.unitLines,

    // 이미지 관련
    imageFolders: imageFoldersStored,
    imagesByCard: imageCardsUI, // (레거시 호환)
    imageCards: imageCardsUI, // (레거시 호환)
    imageCardCounts,
    verticalImages: verticalImagesStored,
    fileItems: verticalImagesUI,
    images: imagesFlatStrings,

    extraExclusiveAreas: a.extraExclusiveAreas,
    extraRealAreas: a.extraRealAreas,

    baseAreaTitle: a.baseAreaTitleOut,
    areaTitle: a.baseAreaTitleOut, // 호환
    areaSetTitle: a.baseAreaTitleOut, // 호환
    extraAreaTitles: a.extraAreaTitlesOut,
    areaSetTitles: a.extraAreaTitlesOut, // 호환

    // 핀 종류(호환 키 포함)
    pinKind: a.pinKind,
    kind: a.pinKind,
    markerKind: a.pinKind,
  } satisfies Record<string, unknown>;

  return payload as unknown as CreatePayload;
}
