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

      // 미디어는 WithMedia 단계에서 채움
      aspect1,
      aspect2,
      aspect3,
    },
  };

  return { base, cardsInput, filesInput };
}

/* ───────────── 2) 미디어(materialize + hydrate) 포함 최종 아이템 ─────────────
   - view.images      : 가로(카드) 전용 URL 평면화
   - view.imageCards  : 가로(카드) 구조 그대로
   - view.fileItems   : 세로(미리보기용 객체 배열)
   - view.imagesVertical / view.verticalImages : 세로 URL 배열(호환 키 동시 제공)
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

  // 가로/세로 URL 분리
  const horizontalUrls = hydratedCards
    .flat()
    .map((m) => m.url)
    .filter(Boolean);
  const verticalUrls = hydratedFiles.map((m) => m.url).filter(Boolean);

  const next: PropertyItem = {
    ...(base as PropertyItem),
    view: {
      ...(base.view as any),
      // 가로(카드)
      imageCards: hydratedCards,
      images: horizontalUrls, // ← 가로 전용

      // 세로(리스트)
      fileItems: hydratedFiles, // 미리보기용 객체
      imagesVertical: verticalUrls, // 권장 호환 키
      verticalImages: verticalUrls, // 추가 호환 키
    },
  };

  return next;
}
