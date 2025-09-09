"use client";

import type { PropertyViewDetails } from "@/features/properties/components/PropertyViewModal/types";

import { getImageUrlFromRef } from "@/lib/imageStore";
import { materializeToRefs } from "@/features/map/lib/idbMedia";

type Params = {
  propertyId: string;
  onPatched: (
    patch: Partial<PropertyViewDetails> & {
      _imageCardRefs?: any;
      _fileItemRefs?: any;
    }
  ) => void;
};

export function useEditPropertySubmit({ propertyId, onPatched }: Params) {
  return async function handleEditSubmit(payload: any) {
    const patch: any = {
      id: payload?.id,
      title: payload?.title,
      address: payload?.address,
      officePhone: payload?.officePhone,
      officePhone2: payload?.officePhone2,
      salePrice: payload?.salePrice,
      listingStars: payload?.listingStars,
      elevator: payload?.elevator,
      parkingType: payload?.parkingType,
      parkingCount: payload?.parkingCount,
      completionDate: payload?.completionDate,
      exclusiveArea: payload?.exclusiveArea,
      realArea: payload?.realArea,
      extraExclusiveAreas: payload?.extraExclusiveAreas,
      extraRealAreas: payload?.extraRealAreas,
      totalBuildings: payload?.totalBuildings,
      totalFloors: payload?.totalFloors,
      totalHouseholds: payload?.totalHouseholds,
      remainingHouseholds: payload?.remainingHouseholds,
      orientations: payload?.orientations,
      aspect: payload?.aspect,
      aspectNo: payload?.aspectNo,
      aspect1: payload?.aspect1,
      aspect2: payload?.aspect2,
      aspect3: payload?.aspect3,
      slopeGrade: payload?.slopeGrade,
      structureGrade: payload?.structureGrade,
      options: payload?.options,
      optionEtc: payload?.optionEtc,
      registry: payload?.registry,
      unitLines: payload?.unitLines,
      publicMemo: payload?.publicMemo,
      secretMemo: payload?.secretMemo,
      images: payload?.images,
      pinKind: payload?.pinKind,
      baseAreaTitle:
        payload?.baseAreaTitle ??
        payload?.areaTitle ??
        payload?.areaSetTitle ??
        "",
      extraAreaTitles: payload?.extraAreaTitles ?? payload?.areaSetTitles ?? [],
    };

    // imageCards/fileItems 우선
    const cardsFromPayload = payload?.imageCards ?? payload?.imagesByCard;
    if (Array.isArray(cardsFromPayload)) {
      patch.imageCards = cardsFromPayload;
    } else if (Array.isArray(payload?.images)) {
      patch.imageCards = [payload.images];
    }
    if (Array.isArray(payload?.fileItems)) {
      patch.fileItems = payload.fileItems;
    }

    try {
      const cardsInput = patch.imageCards ?? [];
      const filesInput = patch.fileItems ?? [];
      const { cardRefs, fileRefs } = await materializeToRefs(
        String(propertyId),
        cardsInput,
        filesInput
      );

      patch._imageCardRefs = cardRefs;
      patch._fileItemRefs = fileRefs;

      // 미리보기 하이드레이션
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

      if (hydratedCards.length) {
        patch.imageCards = hydratedCards;
        patch.images = hydratedCards.flat();
      }
      if (hydratedFiles.length) {
        patch.fileItems = hydratedFiles;
      }
    } catch (e) {
      console.warn("[edit] materialize/hydrate 실패:", e);
    }

    onPatched(patch);
  };
}
