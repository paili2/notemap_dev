import type { PropertyItem } from "@/features/properties/types/propertyItem";
import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";
import type { ImageItem } from "@/features/properties/types/media";
import {
  normalizeImageCards,
  normalizeImages,
  flattenCards,
  normalizeOneImage,
} from "../utils/images";

export function applyPatchToItem(
  p: PropertyItem,
  patch: Partial<PropertyViewDetails> & { pinKind?: string }
): PropertyItem {
  return {
    ...p,
    title: patch.title ?? p.title,
    address: patch.address ?? p.address,
    priceText: (patch as any).salePrice ?? p.priceText,

    ...("pinKind" in patch && patch.pinKind !== undefined
      ? { pinKind: (patch as any).pinKind }
      : { pinKind: (p as any).pinKind }),

    view: {
      ...(p as any).view,

      ...("pinKind" in patch && patch.pinKind !== undefined
        ? { pinKind: (patch as any).pinKind }
        : { pinKind: (p as any).view?.pinKind }),

      ...(() => {
        const cand = (patch as any).imageCards ?? (patch as any).imagesByCard;
        if (Array.isArray(cand)) {
          const cards = normalizeImageCards(cand);
          return { imageCards: cards, images: flattenCards(cards) };
        }
        if ("images" in patch && Array.isArray((patch as any).images)) {
          return { images: normalizeImages((patch as any).images) };
        }
        return {
          images: (p as any).view?.images,
          imageCards: (p as any).view?.imageCards,
        };
      })(),
      fileItems: Array.isArray((patch as any).fileItems)
        ? normalizeImages((patch as any).fileItems)
        : (p as any).view?.fileItems,

      _imageCardRefs: Array.isArray((patch as any)._imageCardRefs)
        ? (patch as any)._imageCardRefs
        : (p as any).view?._imageCardRefs,
      _fileItemRefs: Array.isArray((patch as any)._fileItemRefs)
        ? (patch as any)._fileItemRefs
        : (p as any).view?._fileItemRefs,

      publicMemo: (patch as any).publicMemo ?? (p as any).view?.publicMemo,
      secretMemo: (patch as any).secretMemo ?? (p as any).view?.secretMemo,
      officePhone: (patch as any).officePhone ?? (p as any).view?.officePhone,
      officePhone2:
        (patch as any).officePhone2 ?? (p as any).view?.officePhone2,
      options: (patch as any).options ?? (p as any).view?.options,
      optionEtc: (patch as any).optionEtc ?? (p as any).view?.optionEtc,
      registry: (patch as any).registry ?? (p as any).view?.registry,
      unitLines: (patch as any).unitLines ?? (p as any).view?.unitLines,
      orientations: Array.isArray((patch as any).orientations)
        ? (patch as any).orientations
        : (p as any).view?.orientations,

      listingStars:
        typeof (patch as any).listingStars === "number"
          ? (patch as any).listingStars
          : (p as any).view?.listingStars,

      elevator:
        (patch as any).elevator !== undefined
          ? (patch as any).elevator
          : (p as any).view?.elevator,

      parkingType: (patch as any).parkingType ?? (p as any).view?.parkingType,
      parkingCount:
        (patch as any).parkingCount ?? (p as any).view?.parkingCount,
      slopeGrade: (patch as any).slopeGrade ?? (p as any).view?.slopeGrade,
      structureGrade:
        (patch as any).structureGrade ?? (p as any).view?.structureGrade,

      aspect: (patch as any).aspect ?? (p as any).view?.aspect,
      aspectNo: (patch as any).aspectNo ?? (p as any).view?.aspectNo,
      aspect1: (patch as any).aspect1 ?? (p as any).view?.aspect1,
      aspect2: (patch as any).aspect2 ?? (p as any).view?.aspect2,
      aspect3: (patch as any).aspect3 ?? (p as any).view?.aspect3,

      totalBuildings:
        (patch as any).totalBuildings ?? (p as any).view?.totalBuildings,
      totalFloors: (patch as any).totalFloors ?? (p as any).view?.totalFloors,
      totalHouseholds:
        (patch as any).totalHouseholds ?? (p as any).view?.totalHouseholds,
      remainingHouseholds:
        (patch as any).remainingHouseholds ??
        (p as any).view?.remainingHouseholds,

      completionDate:
        (patch as any).completionDate ?? (p as any).view?.completionDate,
      exclusiveArea:
        (patch as any).exclusiveArea ?? (p as any).view?.exclusiveArea,
      realArea: (patch as any).realArea ?? (p as any).view?.realArea,
      extraExclusiveAreas:
        (patch as any).extraExclusiveAreas ??
        (p as any).view?.extraExclusiveAreas,
      extraRealAreas:
        (patch as any).extraRealAreas ?? (p as any).view?.extraRealAreas,

      baseAreaTitle:
        (patch as any).baseAreaTitle !== undefined
          ? (patch as any).baseAreaTitle
          : (p as any).view?.baseAreaTitle,
      extraAreaTitles:
        (patch as any).extraAreaTitles !== undefined
          ? (patch as any).extraAreaTitles
          : (p as any).view?.extraAreaTitles,
    },
  };
}

export function toViewDetails(p: PropertyItem): PropertyViewDetails {
  const v = (p as any).view ?? {};
  const cards: ImageItem[][] = Array.isArray(v.imageCards)
    ? normalizeImageCards((v as any).imageCards)
    : Array.isArray((v as any).imagesByCard)
    ? normalizeImageCards((v as any).imagesByCard)
    : [];
  const imagesSafe: ImageItem[] =
    cards.length > 0
      ? flattenCards(cards)
      : Array.isArray(v.images)
      ? (v.images.map(normalizeOneImage).filter(Boolean) as ImageItem[])
      : [];

  const filesSafe: ImageItem[] = Array.isArray((v as any).fileItems)
    ? normalizeImages((v as any).fileItems)
    : [];

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
    options: [],
    optionEtc: "",
    registry: "주택",
    unitLines: [],
    listingStars: typeof v.listingStars === "number" ? v.listingStars : 0,
    elevator: (v.elevator as "O" | "X") ?? "O",
    parkingType: "답사지 확인",
    parkingCount: v.parkingCount ?? "",
    completionDate: undefined,
    aspect1: a1,
    aspect2: a2,
    aspect3: a3,
    totalBuildings: 2,
    totalFloors: 10,
    totalHouseholds: 50,
    remainingHouseholds: 10,
    slopeGrade: "상",
    structureGrade: "상",
    publicMemo: "",
    secretMemo: "",
    createdByName: "여준호",
    createdAt: "2025-08-16 09:05",
    inspectedByName: "홍길동",
    inspectedAt: "2025.08.16 10:30",
    updatedByName: "이수정",
    updatedAt: "2025/08/16 11:40",
  } as any;
}
