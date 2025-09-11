import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import type { ImageItem } from "@/features/properties/types/media";
import {
  normalizeImageCards,
  normalizeImages,
  normalizeOneImage,
  flattenCards,
} from "@/features/properties/lib/media/normalize";

/** PropertyItem → ViewModel 변환 (UI 친화) */
export function toViewDetails(p: PropertyItem): PropertyViewDetails {
  const v: any = (p as any).view ?? {};

  // ✅ imagesByCard 제거: imageCards만 수용
  const cards: ImageItem[][] = Array.isArray(v.imageCards)
    ? normalizeImageCards(v.imageCards)
    : [];

  const imagesSafe: ImageItem[] =
    cards.length > 0
      ? flattenCards(cards)
      : Array.isArray(v.images)
      ? (v.images.map(normalizeOneImage).filter(Boolean) as ImageItem[])
      : [];

  const filesSafe: ImageItem[] = Array.isArray(v.fileItems)
    ? normalizeImages(v.fileItems)
    : [];

  // 향/호수 파생
  const ori: { ho: number; value: string }[] = Array.isArray(v.orientations)
    ? (v.orientations as any[]).map((o) => ({
        ho: Number(o.ho),
        value: String(o.value),
      }))
    : [];
  const pick = (ho: number) => ori.find((o) => o.ho === ho)?.value;

  const a1 =
    pick(1) ??
    v.aspect1 ??
    (v.aspectNo === "1호" ? v.aspect : undefined) ??
    "남";
  const a2 =
    pick(2) ??
    v.aspect2 ??
    (v.aspectNo === "2호" ? v.aspect : undefined) ??
    "북";
  const a3 =
    pick(3) ??
    v.aspect3 ??
    (v.aspectNo === "3호" ? v.aspect : undefined) ??
    "남동";

  // 면적 세트 제목(과거 키 호환 제거하고 싶으면 v.areaSetTitle, v.areaTitle 분기 삭제)
  const baseAreaTitle = v.baseAreaTitle ?? v.areaSetTitle ?? v.areaTitle ?? "";
  const extraAreaTitles = v.extraAreaTitles ?? v.areaSetTitles ?? [];

  return {
    status: (p as any).status ?? "공개",
    dealStatus: (p as any).dealStatus ?? "분양중",
    title: p.title,
    address: p.address ?? "",
    type: (p as any).type ?? "주택",
    salePrice: (p as any).priceText ?? "",

    images: imagesSafe,
    imageCards: cards,
    fileItems: filesSafe,

    options: v.options ?? [],
    optionEtc: v.optionEtc ?? "",
    registry: v.registry ?? "주택",
    unitLines: v.unitLines ?? [],
    listingStars: typeof v.listingStars === "number" ? v.listingStars : 0,
    elevator: (v.elevator as "O" | "X") ?? "O",
    parkingType: v.parkingType ?? "답사지 확인",
    parkingCount: v.parkingCount ?? "",
    completionDate: v.completionDate,

    // 면적
    exclusiveArea: v.exclusiveArea,
    realArea: v.realArea,
    extraExclusiveAreas: Array.isArray(v.extraExclusiveAreas)
      ? v.extraExclusiveAreas
      : [],
    extraRealAreas: Array.isArray(v.extraRealAreas) ? v.extraRealAreas : [],

    baseAreaTitle,
    extraAreaTitles,

    // 향/등급 등
    aspect1: a1,
    aspect2: a2,
    aspect3: a3,
    totalBuildings: v.totalBuildings ?? 2,
    totalFloors: v.totalFloors ?? 10,
    totalHouseholds: v.totalHouseholds ?? 50,
    remainingHouseholds: v.remainingHouseholds ?? 10,
    slopeGrade: v.slopeGrade ?? "상",
    structureGrade: v.structureGrade ?? "상",
    publicMemo: v.publicMemo ?? "",
    secretMemo: v.secretMemo ?? "",
    createdByName: v.createdByName ?? "",
    createdAt: v.createdAt ?? "",
    inspectedByName: v.inspectedByName ?? "",
    inspectedAt: v.inspectedAt ?? "",
    updatedByName: v.updatedByName ?? "",
    updatedAt: v.updatedAt ?? "",
  } as any;
}
