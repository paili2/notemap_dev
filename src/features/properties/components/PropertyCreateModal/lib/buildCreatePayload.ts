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

import type { AreaSet as StrictAreaSet } from "../../sections/AreaSetsSection/types";
import { PinKind } from "@/features/pins/types";
import { todayYmdKST } from "@/shared/date/todayYmdKST";
import { CreatePinAreaGroupDto } from "@/features/properties/types/area-group-dto";
import { buildAreaGroups } from "@/features/properties/lib/area";

/** ---------- 공통 유틸 ---------- */

const toNum = (v: unknown) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const toIntOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const s = (v: unknown) => String(v ?? "").trim();

/** 느슨한 AreaSet (필드가 일부 비어 있을 수 있음) */
type LooseAreaSet = Partial<
  Pick<
    StrictAreaSet,
    | "title"
    | "exMinM2"
    | "exMaxM2"
    | "exMinPy"
    | "exMaxPy"
    | "realMinM2"
    | "realMaxM2"
    | "realMinPy"
    | "realMaxPy"
  >
>;

/** 느슨한 AreaSet -> 엄격 AreaSet */
const toStrictAreaSet = (raw: LooseAreaSet | StrictAreaSet): StrictAreaSet => ({
  title: String((raw as any)?.title ?? ""),
  exMinM2: String((raw as any)?.exMinM2 ?? ""),
  exMaxM2: String((raw as any)?.exMaxM2 ?? ""),
  exMinPy: String((raw as any)?.exMinPy ?? ""),
  exMaxPy: String((raw as any)?.exMaxPy ?? ""),
  realMinM2: String((raw as any)?.realMinM2 ?? ""),
  realMaxM2: String((raw as any)?.realMaxM2 ?? ""),
  realMinPy: String((raw as any)?.realMinPy ?? ""),
  realMaxPy: String((raw as any)?.realMaxPy ?? ""),
});

/** 별점 문자열 타입 */
type StarStr = "" | "1" | "2" | "3" | "4" | "5";

/** ---------- 빌더 Args ---------- */
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

  /** ✅ 매물평점: '1' ~ '5' | '' */
  parkingGrade: StarStr;

  parkingType: string | null;

  /** ✅ 총 주차 대수 (0 허용) */
  totalParkingSlots?: number | string | null;

  completionDate?: string;
  salePrice: string;

  baseAreaSet: LooseAreaSet | StrictAreaSet;
  extraAreaSets: Array<LooseAreaSet | StrictAreaSet>;

  elevator: "O" | "X";
  registryOne?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;

  /** ✅ 단지 관련 숫자(문자 입력 허용) */
  totalBuildings: string;
  totalFloors: string;
  totalHouseholds: string;
  remainingHouseholds: string;

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

  lat?: number | null;
  lng?: number | null;

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

    parkingGrade, // ✅ 변경: listingStars 제거
    parkingType,
    totalParkingSlots,
    completionDate,
    // salePrice, // 서버 스펙 확정 후 활성화

    baseAreaSet: baseAreaSetRaw,
    extraAreaSets: extraAreaSetsRaw,

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

    lat,
    lng,

    pinKind,
    pinDraftId,
  } = args;

  const baseAreaSet = toStrictAreaSet(baseAreaSetRaw);
  const extraAreaSets = (
    Array.isArray(extraAreaSetsRaw) ? extraAreaSetsRaw : []
  ).map(toStrictAreaSet);

  const effectiveCompletionDate = s(completionDate) || todayYmdKST();

  /* 1) 향/방향 필드 */
  const {
    orientations, // OrientationRow[]
    aspect,
    aspectNo,
    aspect1,
    aspect2,
    aspect3,
  } = buildOrientationFields(aspects);

  // ✅ 핵심: o.value를 기준으로, 중복 제거 없이 모두 전송
  const directions =
    Array.isArray(orientations) && orientations.length > 0
      ? orientations
          .map((o) => String(o?.value ?? "").trim())
          .filter((v) => v.length > 0)
          .map((direction) => ({ direction }))
      : undefined;

  /* 2) 면적 패킹 (레거시 호환) */
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

  // ✅ 신규 면적 그룹
  const areaGroups: CreatePinAreaGroupDto[] = buildAreaGroups(
    baseAreaSet,
    extraAreaSets
  );

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
    areaGroups?: CreatePinAreaGroupDto[];
    pinKind?: PinKind;
    imageFoldersRaw: ImageItem[][];
    fileItemsRaw: ImageItem[];
    pinDraftId?: number | string | null;
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

    // 연락처 통일 키
    contactMainLabel: officeName?.trim() || "문의",
    contactMainPhone: officePhone,
    ...(officePhone2 && officePhone2.trim() !== ""
      ? {
          contactSubLabel: officeName?.trim() || "사무실",
          contactSubPhone: officePhone2,
        }
      : {}),

    ...(safeBadge ? { badge: safeBadge.slice(0, 30) } : {}),

    /* 향/방향 */
    aspect,
    aspectNo,
    ...(aspect1 ? { aspect1 } : {}),
    ...(aspect2 ? { aspect2 } : {}),
    ...(aspect3 ? { aspect3 } : {}),
    orientations, // 내부 유지
    ...(directions ? { directions } : {}), // ✅ 백엔드 전송

    // 주차 타입은 값 있을 때만 전송
    ...(s(parkingType) ? { parkingType: s(parkingType) } : {}),

    // 총 주차 대수: null 제외(0 허용)
    ...(normalizedTotalParkingSlots === null
      ? {}
      : { totalParkingSlots: normalizedTotalParkingSlots }),

    // 날짜는 빈값이면 오늘(KST)
    completionDate: effectiveCompletionDate,

    /* 면적 (레거시 호환) */
    exclusiveArea,
    realArea,
    extraExclusiveAreas,
    extraRealAreas,

    /* 신규: 면적 그룹 */
    ...(areaGroups.length ? { areaGroups } : {}),

    // ⭐ 매물평점(문자열) — 빈 문자열이면 제외
    ...(parkingGrade ? { parkingGrade } : {}),

    elevator,

    // ✅ 단지 숫자들: 문자열/빈값 → 제외, 숫자면 포함
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
    secretMemo,
    privateMemo: secretMemo,
    registry: registryOne,

    unitLines,

    /* 이미지/파일 */
    imageFolders: imageFoldersStored,
    imageCards: imageCardsUI,
    imageCardCounts,
    verticalImages: verticalImagesStored,
    images: imagesFlatStrings,
    fileItems: verticalImagesUI,
    imageFoldersRaw,
    fileItemsRaw,

    /* 분류/제목 레거시 */
    pinKind,
    baseAreaTitle,
    extraAreaTitles,
    areaSetTitle: baseAreaTitle,
    areaSetTitles: extraAreaTitles,

    /* 분류/ID */
    ...(s(buildingType) ? { buildingType: s(buildingType) } : {}),
    ...(toNum(registrationTypeId) !== undefined
      ? { registrationTypeId: toNum(registrationTypeId)! }
      : {}),
    ...(toNum(parkingTypeId) !== undefined
      ? { parkingTypeId: toNum(parkingTypeId)! }
      : {}),

    /* 좌표 */
    ...(lat != null
      ? { lat: typeof lat === "number" ? lat : Number(String(lat).trim()) }
      : {}),
    ...(lng != null
      ? { lng: typeof lng === "number" ? lng : Number(String(lng).trim()) }
      : {}),

    pinDraftId: pinDraftId ?? null,
  };

  return payload;
}
