"use client";

import type { LatLng } from "@/features/map/types/map";
import type { CreatePayload } from "@/features/properties/types/property-dto";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import {
  materializeToRefs,
  hydrateRefsToMedia,
} from "@/features/map/lib/idbMedia";

type BuildOpts = { id: string; pos: LatLng };

function normalizeOrientations(payload: CreatePayload) {
  const orientations = (payload.orientations ?? [])
    .map((o) => ({ ho: Number(o.ho), value: o.value }))
    .sort((a, b) => a.ho - b.ho);

  const pick = (ho: number) => orientations.find((o) => o.ho === ho)?.value;
  const aspect1 =
    pick(1) ?? (payload.aspectNo === "1호" ? payload.aspect : undefined);
  const aspect2 =
    pick(2) ?? (payload.aspectNo === "2호" ? payload.aspect : undefined);
  const aspect3 =
    pick(3) ?? (payload.aspectNo === "3호" ? payload.aspect : undefined);

  return { orientations, aspect1, aspect2, aspect3 };
}

function extractMediaInputs(payload: any) {
  const refsCardsRaw = Array.isArray(payload.imageFolders)
    ? (payload.imageFolders as any[][])
    : undefined;
  const refsFilesRaw = Array.isArray(payload.verticalImages)
    ? (payload.verticalImages as any[])
    : undefined;

  const cardsUiRaw =
    payload.imageCards ??
    payload.imagesByCard ??
    (Array.isArray(payload.images) ? [payload.images] : []);
  const filesUiRaw = payload.fileItems;

  const cardsInput = refsCardsRaw ?? cardsUiRaw;
  const filesInput = refsFilesRaw ?? filesUiRaw;
  return { cardsInput, filesInput };
}

/** 1) 미디어 처리 전, 베이스 오브젝트 + 미디어 입력만 구성 */
export function buildCreatePatch(
  payload: CreatePayload,
  { id, pos }: BuildOpts
) {
  const { orientations, aspect1, aspect2, aspect3 } =
    normalizeOrientations(payload);
  const { cardsInput, filesInput } = extractMediaInputs(payload);

  const base: any = {
    id,
    title: payload.title,
    address: payload.address,
    priceText: payload.salePrice ?? undefined,
    // 스키마에 없으면 아래 두 속성은 제거하세요.
    status: (payload as any).status,
    dealStatus: (payload as any).dealStatus,
    type: "아파트",
    position: pos,
    favorite: false,
    ...((payload as any).pinKind
      ? ({ pinKind: (payload as any).pinKind } as any)
      : {}),
    view: {
      officePhone: (payload as any).officePhone,
      officePhone2: (payload as any).officePhone2,
      listingStars: payload.listingStars ?? 0,
      elevator: payload.elevator,
      parkingType: payload.parkingType,
      parkingCount: payload.parkingCount,
      completionDate: payload.completionDate,
      exclusiveArea: payload.exclusiveArea,
      realArea: payload.realArea,
      extraExclusiveAreas: (payload as any).extraExclusiveAreas ?? [],
      extraRealAreas: (payload as any).extraRealAreas ?? [],
      totalBuildings: (payload as any).totalBuildings,
      totalFloors: (payload as any).totalFloors,
      totalHouseholds: payload.totalHouseholds,
      remainingHouseholds: (payload as any).remainingHouseholds,
      orientations,
      aspect: payload.aspect,
      aspectNo: payload.aspectNo,
      slopeGrade: payload.slopeGrade,
      structureGrade: payload.structureGrade,
      options: payload.options,
      optionEtc: payload.optionEtc,
      registry:
        typeof (payload as any).registry === "string"
          ? (payload as any).registry
          : "주택",
      unitLines: payload.unitLines,
      publicMemo: payload.publicMemo,
      secretMemo: payload.secretMemo,
      ...((payload as any).pinKind
        ? ({ pinKind: (payload as any).pinKind } as any)
        : {}),
      baseAreaTitle:
        (payload as any).baseAreaTitle ?? (payload as any).areaSetTitle ?? "",
      extraAreaTitles:
        (payload as any).extraAreaTitles ??
        (payload as any).areaSetTitles ??
        [],
      // ↓ 아래 필드는 WithMedia 단계에서 채움
      // _imageCardRefs, _fileItemRefs, imageCards, images, fileItems
      aspect1,
      aspect2,
      aspect3,
    },
  };

  return { base, cardsInput, filesInput };
}

/** 2) 미디어(materialize + hydrate)까지 포함한 최종 아이템 생성 */
export async function buildCreatePatchWithMedia(
  payload: CreatePayload,
  { id, pos }: BuildOpts
): Promise<PropertyItem> {
  const { base, cardsInput, filesInput } = buildCreatePatch(payload, {
    id,
    pos,
  });

  const { cardRefs, fileRefs } = await materializeToRefs(
    id,
    cardsInput,
    filesInput
  );
  const { hydratedCards, hydratedFiles } = await hydrateRefsToMedia(
    cardRefs,
    fileRefs
  );

  const next: PropertyItem = {
    ...(base as PropertyItem),
    view: {
      ...(base.view as any),
      _imageCardRefs: cardRefs,
      _fileItemRefs: fileRefs,
      imageCards: hydratedCards,
      images: hydratedCards.flat(),
      fileItems: hydratedFiles,
    },
  };

  return next;
}
