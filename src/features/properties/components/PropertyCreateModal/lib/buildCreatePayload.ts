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
  ImageItem, // UI(입력/미리보기)용: url/idbKey 모두 선택적
  StoredMediaItem, // 서버 전송/저장용 최소 스키마
} from "@/features/properties/types/media";

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
  imageFolders: ImageItem[][]; // 카드별 이미지(2차원)
  fileItems: ImageItem[]; // 세로형/추가 파일 리스트(선택 사용)
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

  // 3) 이미지 포맷
  const imageFoldersRaw: ImageItem[][] = imageFolders.map((card) =>
    card.map((i) => ({ ...i }))
  );
  const fileItemsRaw: ImageItem[] = fileItems.map((i) => ({ ...i }));
  // ▶ 레거시 UI용: url이 있는 것만 포함 (타입상 url: string이어야 함)
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

  // ▶ 서버 전송용: url 또는 idbKey가 있어도 모두 포함(신규 누락 방지)
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

  // ▶ 레거시 UI용 fileItems: url 있는 것만
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

  // 4) 최종 payload
  const payload: CreatePayload & {
    imageFolders: StoredMediaItem[][];
    imagesByCard: Array<Array<{ url: string; name: string; caption?: string }>>;
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
  } = {
    // 기본
    title,
    address,
    officeName,
    officePhone,
    officePhone2,
    moveIn,
    floor,
    roomNo,
    structure,

    // 향/방향
    aspect,
    aspectNo,
    ...(aspect1 ? { aspect1 } : {}),
    ...(aspect2 ? { aspect2 } : {}),
    ...(aspect3 ? { aspect3 } : {}),
    orientations,

    // 가격/주차/준공
    salePrice,
    parkingType,
    parkingCount,
    completionDate,

    // 면적/평점/엘리베이터/통계
    exclusiveArea,
    realArea,
    listingStars,
    elevator,
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,

    // 등급/등기/옵션/메모
    slopeGrade,
    structureGrade,
    options,
    optionEtc: etcChecked ? optionEtc.trim() : "",
    publicMemo,
    secretMemo,
    registry: registryOne,

    // 유닛
    unitLines,

    // 이미지
    imageFolders: imageFoldersStored,
    imagesByCard: imageCardsUI,
    imageCards: imageCardsUI,
    imageCardCounts,
    verticalImages: verticalImagesStored,
    images: imagesFlatStrings,
    fileItems: verticalImagesUI,
    imageFoldersRaw,
    fileItemsRaw,

    // 추가 면적
    extraExclusiveAreas,
    extraRealAreas,

    // 핀 속성
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
