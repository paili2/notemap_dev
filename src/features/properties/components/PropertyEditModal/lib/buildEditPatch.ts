import {
  hydrateRefsToMedia,
  materializeToRefs,
} from "@/features/map/lib/idbMedia";
import { PropertyViewDetails } from "../../PropertyViewModal/types";

export function buildEditPatch(payload: any, selectedId?: string) {
  const patch: Partial<PropertyViewDetails> & { pinKind?: string } = {
    id: payload.id,
    title: payload.title,
    address: payload.address,
    officePhone: payload.officePhone,
    officePhone2: payload.officePhone2,
    salePrice: payload.salePrice,
    listingStars: payload.listingStars,
    elevator: payload.elevator,
    parkingType: payload.parkingType,
    parkingCount: payload.parkingCount,
    completionDate: payload.completionDate,
    exclusiveArea: payload.exclusiveArea,
    realArea: payload.realArea,
    extraExclusiveAreas: payload.extraExclusiveAreas,
    extraRealAreas: payload.extraRealAreas,
    totalBuildings: payload.totalBuildings,
    totalFloors: payload.totalFloors,
    totalHouseholds: payload.totalHouseholds,
    remainingHouseholds: payload.remainingHouseholds,
    orientations: payload.orientations,
    aspect: payload.aspect,
    aspectNo: payload.aspectNo,
    aspect1: payload.aspect1,
    aspect2: payload.aspect2,
    aspect3: payload.aspect3,
    slopeGrade: payload.slopeGrade,
    structureGrade: payload.structureGrade,
    options: payload.options,
    optionEtc: payload.optionEtc,
    registry: payload.registry,
    unitLines: payload.unitLines,
    publicMemo: payload.publicMemo,
    secretMemo: payload.secretMemo,
    images: payload.images,
    pinKind: payload.pinKind,
    baseAreaTitle:
      payload.baseAreaTitle ?? payload.areaTitle ?? payload.areaSetTitle ?? "",
    extraAreaTitles: payload.extraAreaTitles ?? payload.areaSetTitles ?? [],
  };

  // 이미지/파일 세트 후처리
  const cardsFromPayload = payload.imageCards ?? payload.imagesByCard;
  if (Array.isArray(cardsFromPayload)) {
    (patch as any).imageCards = cardsFromPayload;
  } else if (Array.isArray(payload.images)) {
    (patch as any).imageCards = [payload.images];
  }
  if (Array.isArray(payload.fileItems)) {
    (patch as any).fileItems = payload.fileItems;
  }

  return patch;
}

export async function buildEditPatchWithMedia(
  payload: any,
  selectedId?: string
) {
  const patch = buildEditPatch(payload, selectedId) as any;

  const propertyId = String(payload?.id ?? selectedId ?? "");
  const refsCardsRaw = Array.isArray(payload?.imageFolders)
    ? (payload.imageFolders as any[][])
    : patch.imageCards ?? [];
  const refsFilesRaw = Array.isArray(payload?.verticalImages)
    ? (payload.verticalImages as any[])
    : patch.fileItems ?? [];

  const { cardRefs, fileRefs } = await materializeToRefs(
    propertyId,
    refsCardsRaw,
    refsFilesRaw
  );
  const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
    cardRefs,
    fileRefs
  );

  patch._imageCardRefs = cardRefs;
  patch._fileItemRefs = fileRefs;

  if (hydratedCards.length) {
    patch.imageCards = hydratedCards;
    patch.images = hydratedCards.flat();
  }
  if (hydratedFiles.length) {
    patch.fileItems = hydratedFiles;
  }

  return patch as Partial<PropertyViewDetails>;
}
