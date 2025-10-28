import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import type { ImageItem } from "@/features/properties/types/media";
import {
  normalizeImageCards,
  normalizeImages,
  normalizeOneImage,
  flattenCards,
} from "@/features/properties/lib/media/normalize";
import type { ViewSource } from "@/features/properties/lib/view/types";

/** 안전 변환 유틸 */
const toNumOr = (v: any, fallback: number) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;
const toStrOr = (v: any, fallback = "") =>
  typeof v === "string" ? v : v == null ? fallback : String(v);
const isNonEmpty = (s: any) => typeof s === "string" && s.trim() !== "";

/** ViewSource → ViewModel 변환 (UI 친화) */
export function toViewDetails(p: ViewSource): PropertyViewDetails {
  // 백엔드가 내려주는 view 블록(선택적)
  const v = (p as unknown as { view?: Record<string, any> })?.view ?? {};

  // ✅ imagesByCard는 무시하고 imageCards만 수용
  const cards: ImageItem[][] = Array.isArray(v.imageCards)
    ? normalizeImageCards(v.imageCards)
    : [];

  // 카드가 있으면 카드 기반 일람, 없으면 옛날 단일 images/fileItems 호환
  const imagesFromCards: ImageItem[] = cards.length ? flattenCards(cards) : [];
  const imagesLegacy: ImageItem[] = Array.isArray(v.images)
    ? (v.images.map(normalizeOneImage).filter(Boolean) as ImageItem[])
    : [];
  const images: ImageItem[] =
    imagesFromCards.length > 0 ? imagesFromCards : imagesLegacy;

  const fileItems: ImageItem[] = Array.isArray(v.fileItems)
    ? normalizeImages(v.fileItems)
    : [];

  // 향/호수 파생
  type OriRow = { ho: number; value: string };
  const orientations: OriRow[] = Array.isArray(v.orientations)
    ? (v.orientations as any[]).map((o) => ({
        ho: toNumOr(o?.ho, NaN),
        value: toStrOr(o?.value),
      }))
    : [];

  const pick = (ho: number) =>
    orientations.find((o) => o.ho === ho && isNonEmpty(o.value))?.value;

  // 과거 키 호환: aspect1/2/3, aspectNo + aspect
  const a1 =
    pick(1) ||
    (isNonEmpty(v.aspect1) ? String(v.aspect1) : undefined) ||
    (v.aspectNo === "1호" && isNonEmpty(v.aspect)
      ? String(v.aspect)
      : undefined);
  const a2 =
    pick(2) ||
    (isNonEmpty(v.aspect2) ? String(v.aspect2) : undefined) ||
    (v.aspectNo === "2호" && isNonEmpty(v.aspect)
      ? String(v.aspect)
      : undefined);
  const a3 =
    pick(3) ||
    (isNonEmpty(v.aspect3) ? String(v.aspect3) : undefined) ||
    (v.aspectNo === "3호" && isNonEmpty(v.aspect)
      ? String(v.aspect)
      : undefined);

  // 면적 세트 제목(레거시 키 호환)
  const baseAreaTitle =
    toStrOr(v.baseAreaTitle) || toStrOr(v.areaSetTitle) || toStrOr(v.areaTitle);
  const extraAreaTitles: string[] = Array.isArray(v.extraAreaTitles)
    ? v.extraAreaTitles.map((s: any) => toStrOr(s)).filter(Boolean)
    : Array.isArray(v.areaSetTitles)
    ? v.areaSetTitles.map((s: any) => toStrOr(s)).filter(Boolean)
    : [];

  // 숫자류 안전 기본값: 기존 하드코딩 대신 undefined 유지
  const totalBuildings = Number.isFinite(Number(v.totalBuildings))
    ? Number(v.totalBuildings)
    : undefined;
  const totalFloors = Number.isFinite(Number(v.totalFloors))
    ? Number(v.totalFloors)
    : undefined;
  const totalHouseholds = Number.isFinite(Number(v.totalHouseholds))
    ? Number(v.totalHouseholds)
    : undefined;
  const remainingHouseholds = Number.isFinite(Number(v.remainingHouseholds))
    ? Number(v.remainingHouseholds)
    : undefined;

  // 별점 0~5 범위 클램프
  const listingStarsRaw =
    typeof v.listingStars === "number"
      ? v.listingStars
      : Number(v.listingStars);
  const listingStars = Number.isFinite(listingStarsRaw)
    ? Math.max(0, Math.min(5, listingStarsRaw))
    : 0;

  // 엘리베이터: "O"/"X" 외 값 들어오면 기본값 "O"
  const elevator =
    v.elevator === "O" || v.elevator === "X" ? (v.elevator as "O" | "X") : "O";

  // 주차: type 라벨/개수(문자), 레거시 값과 공백 허용
  const parkingType = isNonEmpty(v.parkingType)
    ? String(v.parkingType)
    : "답사지 확인";
  const parkingCount = isNonEmpty(v.parkingCount) ? String(v.parkingCount) : "";

  // 날짜/작성자 정보: 문자열만 반영
  const createdAt = toStrOr(v.createdAt);
  const updatedAt = toStrOr(v.updatedAt);
  const inspectedAt = toStrOr(v.inspectedAt);

  const createdByName = toStrOr(v.createdByName);
  const updatedByName = toStrOr(v.updatedByName);
  const inspectedByName = toStrOr(v.inspectedByName);

  // 옵션/등기/유닛라인 등 배열/문자 기본 처리
  const options: string[] = Array.isArray(v.options)
    ? v.options.map((s: any) => toStrOr(s)).filter(Boolean)
    : [];
  const unitLines = Array.isArray(v.unitLines) ? v.unitLines : [];
  const optionEtc = toStrOr(v.optionEtc);
  const registry = isNonEmpty(v.registry) ? String(v.registry) : "주택";

  return {
    // 상단 메타
    status: (p as any).status ?? "공개",
    dealStatus: (p as any).dealStatus ?? "분양중",
    title: toStrOr(p.title),
    address: toStrOr(p.address),

    // 유형/가격
    type: (p as any).type ?? "주택",
    salePrice: toStrOr((p as any).priceText),

    // 미디어
    images,
    imageCards: cards,
    fileItems,

    // 옵션/문구
    options,
    optionEtc,
    registry,

    // 라인/평면 등
    unitLines,

    // 부가 정보
    listingStars,
    elevator,
    parkingType,
    parkingCount,
    completionDate: isNonEmpty(v.completionDate)
      ? String(v.completionDate)
      : undefined,

    // 면적 (숫자/배열 그대로 통과, undefined 허용)
    exclusiveArea: Number.isFinite(Number(v.exclusiveArea))
      ? Number(v.exclusiveArea)
      : undefined,
    realArea: Number.isFinite(Number(v.realArea))
      ? Number(v.realArea)
      : undefined,
    extraExclusiveAreas: Array.isArray(v.extraExclusiveAreas)
      ? v.extraExclusiveAreas
      : [],
    extraRealAreas: Array.isArray(v.extraRealAreas) ? v.extraRealAreas : [],

    baseAreaTitle,
    extraAreaTitles,

    // 향(존재하는 값만)
    aspect1: a1,
    aspect2: a2,
    aspect3: a3,

    // 수량 정보(선택)
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,

    // 등급류
    slopeGrade: toStrOr(v.slopeGrade) || undefined,
    structureGrade: toStrOr(v.structureGrade) || undefined,

    // 메모
    publicMemo: toStrOr(v.publicMemo),
    secretMemo: toStrOr(v.secretMemo),

    // 작성/수정/검수 정보
    createdByName,
    createdAt,
    inspectedByName,
    inspectedAt,
    updatedByName,
    updatedAt,
  } as PropertyViewDetails;
}
