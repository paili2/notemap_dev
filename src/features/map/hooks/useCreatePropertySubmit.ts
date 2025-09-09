"use client";

import type { LatLng } from "@/features/map/types/map";
import type { CreatePayload } from "@/features/properties/types/property-dto";
import type { PropertyItem } from "@/features/properties/types/propertyItem";
import { getImageUrlFromRef } from "@/lib/imageStore";
import { materializeToRefs } from "../lib/idbMedia";

type Params = {
  draftPin: LatLng | null;
  selectedPosition?: LatLng | null;
  defaultPosition: LatLng;
  onCreated: (item: PropertyItem) => void;
};

export function useCreatePropertySubmit({
  draftPin,
  selectedPosition,
  defaultPosition,
  onCreated,
}: Params) {
  return async function handleCreateSubmit(payload: CreatePayload) {
    const id = `${Date.now()}`;
    const pos = draftPin ?? selectedPosition ?? defaultPosition;

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

    // 새 정책: imageCards/fileItems 중심
    const cardsInput =
      (payload as any).imageCards ??
      (Array.isArray((payload as any).images) ? [(payload as any).images] : []);
    const filesInput = (payload as any).fileItems ?? [];

    const { cardRefs, fileRefs } = await materializeToRefs(
      id,
      cardsInput,
      filesInput
    );

    // 미리보기 URL 하이드레이션
    const hydratedCards: any[][] = [];
    for (const g of cardRefs) {
      const arr: any[] = [];
      for (const r of g) {
        const url = await getImageUrlFromRef(r);
        if (url) arr.push({ url, name: r.name, caption: r.caption });
      }
      if (arr.length) hydratedCards.push(arr);
    }
    const hydratedFiles: any[] = [];
    for (const r of fileRefs) {
      const url = await getImageUrlFromRef(r);
      if (url) hydratedFiles.push({ url, name: r.name, caption: r.caption });
    }

    const next: PropertyItem = {
      id,
      title: payload.title,
      address: payload.address,
      priceText: payload.salePrice ?? undefined,
      status: (payload as any).status,
      dealStatus: (payload as any).dealStatus,
      type: "아파트",
      position: pos,
      favorite: false,
      ...(((payload as any).pinKind
        ? { pinKind: (payload as any).pinKind }
        : {}) as any),
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
        ...(((payload as any).pinKind
          ? { pinKind: (payload as any).pinKind }
          : {}) as any),
        baseAreaTitle:
          (payload as any).baseAreaTitle ?? (payload as any).areaSetTitle ?? "",
        extraAreaTitles:
          (payload as any).extraAreaTitles ??
          (payload as any).areaSetTitles ??
          [],
        _imageCardRefs: cardRefs,
        _fileItemRefs: fileRefs,
        imageCards: hydratedCards,
        images: hydratedCards.flat(),
        fileItems: hydratedFiles,
        aspect1,
        aspect2,
        aspect3,
      },
    };

    onCreated(next);
  };
}
