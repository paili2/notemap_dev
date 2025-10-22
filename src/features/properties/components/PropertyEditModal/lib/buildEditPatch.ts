import { hydrateRefsToMedia, materializeToRefs } from "@/lib/media/refs";
import { PropertyViewDetails } from "../../PropertyViewModal/types";

function buildEditPatch(payload: any, selectedId?: string) {
  const patch: Partial<PropertyViewDetails> & { pinKind?: string } = {
    id: payload.id ?? selectedId,
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
    aspectNo:
      typeof payload.aspectNo === "string"
        ? Number(payload.aspectNo)
        : payload.aspectNo,
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
    // 이미지 계열은 WithMedia에서 최종 세팅
    images: payload.images,
    pinKind: payload.pinKind,
    baseAreaTitle:
      payload.baseAreaTitle ?? payload.areaTitle ?? payload.areaSetTitle ?? "",
    extraAreaTitles: payload.extraAreaTitles ?? payload.areaSetTitles ?? [],
  };

  // UI 배열이 바로 왔다면 임시로 얹어두기(후에 WithMedia에서 대체/보강)
  const cardsFromPayload = payload.imageCards ?? payload.imagesByCard;
  if (Array.isArray(cardsFromPayload))
    (patch as any).imageCards = cardsFromPayload;
  else if (Array.isArray(payload.images))
    (patch as any).imageCards = [payload.images];

  if (Array.isArray(payload.fileItems))
    (patch as any).fileItems = payload.fileItems;

  return patch;
}

export async function buildEditPatchWithMedia(
  payload: any,
  selectedId?: string
) {
  const patch = buildEditPatch(payload, selectedId) as any;

  const propertyId = String(payload?.id ?? selectedId ?? "");

  // ✅ 입력 소스(우선순위): refs/폴더 → imageCards/imagesByCard → images(평탄) → 없음
  const cardsInput =
    (Array.isArray(payload?.imageFolders) && payload.imageFolders) ||
    patch.imageCards ||
    (Array.isArray(payload?.images) ? [payload.images] : []);

  // ✅ 세로열 입력 소스(우선순위): refs/verticalImages → fileItems → imagesVertical(레거시) → 없음
  const filesInput =
    (Array.isArray(payload?.verticalImages) && payload.verticalImages) ||
    patch.fileItems ||
    (Array.isArray(payload?.imagesVertical) ? payload.imagesVertical : []) ||
    [];

  // blob/url/idbKey → refs 저장
  const { cardRefs, fileRefs } = await materializeToRefs(
    propertyId,
    cardsInput,
    filesInput
  );

  // refs → 화면용 ImageItem 하이드레이션
  const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
    cardRefs,
    fileRefs
  );

  // ✅ refs는 항상 보존
  patch._imageCardRefs = cardRefs;
  patch._fileItemRefs = fileRefs;

  // ✅ 실제 화면/저장용 배열은 "있을 때만" 덮어쓰기 (빈 배열로 기존 걸 지우지 않음)
  if (hydratedCards.length > 0) {
    patch.imageCards = hydratedCards;
    patch.imagesByCard = hydratedCards; // 레거시 호환
    patch.imageCardCounts = hydratedCards.map((c: any[]) => c.length); // 레거시 호환
    patch.images = hydratedCards.flat();
  }
  if (hydratedFiles.length > 0) {
    patch.fileItems = hydratedFiles;
  }

  return patch as Partial<PropertyViewDetails>;
}
