"use client";

import type { UpdatePayload } from "@/features/properties/types/property-dto";
import type {
  Registry,
  Grade,
  UnitLine,
  OrientationRow,
} from "@/features/properties/types/property-domain";
import type { ImageItem } from "@/features/properties/types/media";
import type { AreaSet } from "../../sections/AreaSetsSection/types";
import type { PinKind } from "@/features/pins/types";

/** "" | null | undefined → null, 숫자/숫자문자열 → 정수, 그 외 null */
const toIntOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

/** 숫자 → 문자열, 문자열은 trim, 빈문자면 undefined 반환 */
const toNumericStringOrUndefined = (v: string | number | null | undefined) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

/** '1' | '2' | '3' | '4' | '5' | '' | undefined → '1'~'5' | undefined */
const toParkingGradeOrUndefined = (
  v: "" | "1" | "2" | "3" | "4" | "5" | null | undefined
): "1" | "2" | "3" | "4" | "5" | undefined => {
  if (!v) return undefined;
  return (["1", "2", "3", "4", "5"] as const).includes(v as any)
    ? (v as any)
    : undefined;
};

type BuildUpdateArgs = {
  // 기본
  title?: string;
  address?: string;
  officeName?: string;
  officePhone?: string;
  officePhone2?: string;
  moveIn?: string;
  floor?: string;
  roomNo?: string;
  structure?: string;

  // 평점/주차/준공/매매
  /** ⭐ 매물평점: '1' | '2' | '3' | '4' | '5' | '' */
  parkingGrade?: "" | "1" | "2" | "3" | "4" | "5";
  parkingType?: string | null;
  /** ✅ 신규 메인: 총 주차대수 */
  totalParkingSlots?: number | string | null;
  completionDate?: string;
  salePrice?: string | number | null;

  // 면적
  baseAreaSet?: AreaSet; // (참고용: 아래 pack된 값들만 실제 전송)
  extraAreaSets?: AreaSet[];
  exclusiveArea?: string;
  realArea?: string;
  extraExclusiveAreas?: string[];
  extraRealAreas?: string[];
  baseAreaTitleOut?: string;
  extraAreaTitlesOut?: string[];

  // 등기/등급/엘리베이터
  elevator?: "O" | "X";
  registryOne?: Registry;
  slopeGrade?: Grade;
  structureGrade?: Grade;

  // 숫자
  totalBuildings?: string | number;
  totalFloors?: string | number;
  totalHouseholds?: string | number;
  remainingHouseholds?: string | number;

  // 옵션/메모
  options?: string[];
  etcChecked?: boolean;
  optionEtc?: string;
  publicMemo?: string | null;
  secretMemo?: string | null;

  // 향/유닛
  /** OrientationRow[] 또는 간이형 둘 다 허용 */
  orientations?:
    | OrientationRow[]
    | Array<{
        dir?: string; // 간이형 호환(미사용)
        weight?: number | null; // 간이형 호환
        ho?: string | number | null;
        value?: number | null;
      }>;
  aspect?: string;
  aspectNo?: number;
  aspect1?: string;
  aspect2?: string;
  aspect3?: string;
  unitLines?: UnitLine[];

  // 이미지
  imageFolders?: ImageItem[][]; // 가로(카드들)
  verticalImages?: ImageItem[]; // 세로(단일 카드)

  // 기타
  pinKind?: PinKind;
};

export function buildUpdatePayload(a: BuildUpdateArgs): UpdatePayload {
  // ========= 이미지 수집 =========
  // 가로 카드(여러 그룹) + 세로 카드(단일 배열) → URL 평면화 + 중복 제거
  const urls: string[] = [];
  const pushUrl = (u?: string) => {
    if (!u) return;
    if (typeof u !== "string") return;
    const s = u.trim();
    if (!s) return;
    if (!urls.includes(s)) urls.push(s);
  };

  // 가로 카드들
  if (Array.isArray(a.imageFolders)) {
    for (const group of a.imageFolders) {
      if (Array.isArray(group)) {
        for (const img of group) pushUrl(img?.url);
      }
    }
  }
  // 세로 카드
  if (Array.isArray(a.verticalImages)) {
    for (const img of a.verticalImages) pushUrl(img?.url);
  }

  // ========= 옵션/메모 =========
  const optionEtcFinal = a.etcChecked
    ? (a.optionEtc ?? "").trim()
    : a.optionEtc ?? "";

  // ✅ totalParkingSlots만 사용 (parkingCount 제거). 0 허용.
  const normalizedTotalParkingSlots =
    a.totalParkingSlots === undefined
      ? undefined
      : toIntOrNull(a.totalParkingSlots);

  // ✅ orientations 정규화: (OrientationRow | 간이형)[] → OrientationRow[]
  let orientationsNormalized: OrientationRow[] | undefined;
  if (Array.isArray(a.orientations)) {
    orientationsNormalized = a.orientations.map((o: any) => {
      // OrientationRow 형태 보존
      if ("ho" in o || "value" in o) {
        return {
          ho: (o.ho ?? null) as any,
          value: (o.value ?? null) as any,
        } as OrientationRow;
      }
      // 간이형 → OrientationRow
      return {
        ho: (o.ho ?? null) as any,
        value: (o.value ?? o.weight ?? null) as any,
      } as OrientationRow;
    });
  }

  // ✅ salePrice는 서버 DTO가 string 기대 → 문자열로 정규화
  const salePriceStr = toNumericStringOrUndefined(a.salePrice);

  // ✅ parkingGrade 문자열 정규화
  const parkingGradeVal = toParkingGradeOrUndefined(
    a.parkingGrade ?? undefined
  );

  const patch: UpdatePayload = {
    // 기본
    ...(a.title !== undefined ? { title: a.title } : {}),
    ...(a.address !== undefined ? { address: a.address } : {}),
    ...(a.officeName !== undefined ? { officeName: a.officeName } : {}),
    ...(a.officePhone !== undefined ? { officePhone: a.officePhone } : {}),
    ...(a.officePhone2 !== undefined ? { officePhone2: a.officePhone2 } : {}),
    ...(a.moveIn !== undefined ? { moveIn: a.moveIn } : {}),
    ...(a.floor !== undefined ? { floor: a.floor } : {}),
    ...(a.roomNo !== undefined ? { roomNo: a.roomNo } : {}),
    ...(a.structure !== undefined ? { structure: a.structure } : {}),

    // 향/방향
    ...(a.aspect !== undefined ? { aspect: a.aspect } : {}),
    ...(a.aspectNo !== undefined ? { aspectNo: String(a.aspectNo) } : {}),
    ...(a.aspect1 ? { aspect1: a.aspect1 } : {}),
    ...(a.aspect2 ? { aspect2: a.aspect2 } : {}),
    ...(a.aspect3 ? { aspect3: a.aspect3 } : {}),
    ...(a.orientations !== undefined
      ? { orientations: orientationsNormalized ?? [] }
      : {}),

    // 가격/주차/준공
    ...(a.salePrice !== undefined ? { salePrice: salePriceStr } : {}),
    ...(a.parkingType !== undefined
      ? { parkingType: a.parkingType ?? undefined }
      : {}),
    ...(normalizedTotalParkingSlots !== undefined
      ? { totalParkingSlots: normalizedTotalParkingSlots }
      : {}),
    ...(a.completionDate !== undefined
      ? { completionDate: a.completionDate }
      : {}),

    // ⭐ 평점/엘리베이터
    ...(a.parkingGrade !== undefined && parkingGradeVal !== undefined
      ? { parkingGrade: parkingGradeVal }
      : a.parkingGrade !== undefined
      ? {} // 빈 문자열/잘못된 값이면 보내지 않음
      : {}),
    ...(a.elevator !== undefined ? { elevator: a.elevator } : {}),

    // 숫자 필드(문자/숫자 혼용 허용: 서버 DTO가 처리)
    ...(a.totalBuildings !== undefined
      ? { totalBuildings: a.totalBuildings }
      : {}),
    ...(a.totalFloors !== undefined ? { totalFloors: a.totalFloors } : {}),
    ...(a.totalHouseholds !== undefined
      ? { totalHouseholds: a.totalHouseholds }
      : {}),
    ...(a.remainingHouseholds !== undefined
      ? { remainingHouseholds: a.remainingHouseholds }
      : {}),

    // 등급/등기
    ...(a.slopeGrade !== undefined ? { slopeGrade: a.slopeGrade } : {}),
    ...(a.structureGrade !== undefined
      ? { structureGrade: a.structureGrade }
      : {}),
    ...(a.registryOne !== undefined ? { registry: a.registryOne } : {}),

    // 옵션/메모
    ...(a.options !== undefined ? { options: a.options } : {}),
    ...(a.optionEtc !== undefined ? { optionEtc: optionEtcFinal } : {}),
    ...(a.publicMemo !== undefined ? { publicMemo: a.publicMemo } : {}),
    ...(a.secretMemo !== undefined ? { secretMemo: a.secretMemo } : {}),

    // 면적
    ...(a.exclusiveArea !== undefined
      ? { exclusiveArea: a.exclusiveArea }
      : {}),
    ...(a.realArea !== undefined ? { realArea: a.realArea } : {}),
    ...(a.extraExclusiveAreas !== undefined
      ? { extraExclusiveAreas: a.extraExclusiveAreas }
      : {}),
    ...(a.extraRealAreas !== undefined
      ? { extraRealAreas: a.extraRealAreas }
      : {}),

    // 유닛
    ...(a.unitLines !== undefined ? { unitLines: a.unitLines } : {}),

    // 이미지(서버가 문자열 배열만 받는 경우)
    ...(urls.length ? { images: urls } : {}),
  };

  return patch;
}
