"use client";

import { CreatePayload } from "@/features/properties/types/property-dto";
import { PropertyItem } from "@/features/properties/types/propertyItem";
import { LatLng } from "@/lib/geo/types";

import { hydrateRefsToMedia, materializeToRefs } from "@/lib/media/refs";

type BuildOpts = { id: string; pos: LatLng };

/* ───────────── 방향/호수 정규화 ───────────── */
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

/* ───────────── 미디어 입력 추출(레거시 제거) ─────────────
   - imagesByCard는 더 이상 보지 않음(사용자 선호 반영)
   - 카드형 입력: imageFolders(레퍼런스) → 없으면 UI 측 imageCards / images[[]] 폴백
   - 세로열 입력: verticalImages(레퍼런스) → 없으면 fileItems 폴백
*/
function extractMediaInputs(payload: any) {
  const refsCardsRaw = Array.isArray(payload.imageFolders)
    ? (payload.imageFolders as any[][])
    : undefined;

  const refsFilesRaw = Array.isArray(payload.verticalImages)
    ? (payload.verticalImages as any[])
    : undefined;

  const cardsUiRaw =
    payload.imageCards ??
    (Array.isArray(payload.images) ? [payload.images] : []);

  const filesUiRaw = payload.fileItems;

  const cardsInput = refsCardsRaw ?? cardsUiRaw;
  const filesInput = refsFilesRaw ?? filesUiRaw;

  return { cardsInput, filesInput };
}

/* ───────────── 1) 미디어 처리 전, 베이스 + 미디어 입력 구성 ───────────── */
function buildCreatePatch(payload: CreatePayload, { id, pos }: BuildOpts) {
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

      // ✅ 이름 일관화: parkingCount → totalParkingSlots
      totalParkingSlots: (payload as any).parkingCount,

      parkingType: payload.parkingType,
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

      // 서버가 registryOne을 요구한다면 상위 buildUpdatePayload에서 매핑.
      // 여기서는 문자열 레지스트리 값만 사용.
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

      // ↓ 미디어는 WithMedia 단계에서 채움
      // (레거시) *_Refs, imagesByCard는 더 이상 넣지 않음
      aspect1,
      aspect2,
      aspect3,
    },
  };

  return { base, cardsInput, filesInput };
}

/* ───────────── 2) 미디어(materialize + hydrate) 포함 최종 아이템 ─────────────
   - 내부적으로 refs 사용하지만, view에는 레거시 *_Refs를 넣지 않고
     imageCards / images / fileItems만 채운다.
*/
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
      imageCards: hydratedCards,
      images: hydratedCards.flat(),
      fileItems: hydratedFiles,
    },
  };

  return next;
}
