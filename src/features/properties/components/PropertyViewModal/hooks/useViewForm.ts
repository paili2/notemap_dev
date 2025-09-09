"use client";

import { useMemo, useState } from "react";
import { toYMDFlexible } from "@/lib/dateUtils";
import { useViewImagesHydration } from "../hooks/useViewImagesHydration";
import { extractViewMeta } from "../utils/extractViewMeta";
import type { MemoTab, PropertyViewDetails } from "../types";

/** View 전용 뷰 모델 훅: 모든 파생값/상태를 f에 모아줌 */
export function useViewForm({
  open,
  data,
}: {
  open: boolean;
  data: PropertyViewDetails | null | undefined;
}) {
  // 메모 탭 상태
  const [memoTab, setMemoTab] = useState<MemoTab>("KN");

  // 이미지 하이드레이션
  const { preferCards, cardsHydrated, filesHydrated, legacyImagesHydrated } =
    useViewImagesHydration({ open, data: data as any });

  const imagesProp = preferCards ? undefined : legacyImagesHydrated;

  // 메타 파생
  const { pinKind, baseAreaTitleView, extraAreaTitlesView } = extractViewMeta(
    (data ?? {}) as any
  );

  // 안전한 프리미티브 추출
  const view = useMemo(() => {
    const d = (data ?? {}) as PropertyViewDetails;
    return {
      title: d.title ?? "",
      listingStars: d.listingStars ?? 0,
      elevator: (d.elevator as "O" | "X") ?? "O",

      address: d.address ?? "",
      officePhone: d.officePhone ?? "",
      officePhone2: d.officePhone2 ?? "",

      totalBuildings: d.totalBuildings,
      totalFloors: d.totalFloors,
      totalHouseholds: d.totalHouseholds,
      remainingHouseholds: d.remainingHouseholds,

      parkingType: d.parkingType ?? "",
      parkingCount: d.parkingCount,

      completionDateText: toYMDFlexible(d.completionDate, { utc: true }),
      salePrice: d.salePrice,
      registry: d.registry,
      slopeGrade: d.slopeGrade,
      structureGrade: d.structureGrade,

      unitLines: Array.isArray(d.unitLines) ? d.unitLines : [],

      options: d.options ?? [],
      optionEtc: d.optionEtc ?? "",

      publicMemo: d.publicMemo ?? "",
      secretMemo: d.secretMemo ?? "",

      exclusiveArea: d.exclusiveArea,
      realArea: d.realArea,
      extraExclusiveAreas: d.extraExclusiveAreas,
      extraRealAreas: d.extraRealAreas,
      baseAreaTitleView,
      extraAreaTitlesView,
    };
  }, [data, baseAreaTitleView, extraAreaTitlesView]);

  // Create/Edit과 동일하게 한 객체 f로 반환
  const f = useMemo(
    () => ({
      // 헤더
      title: view.title,
      listingStars: view.listingStars,
      elevator: view.elevator as "O" | "X",
      pinKind,

      // 이미지
      preferCards,
      cardsHydrated,
      filesHydrated,
      imagesProp,

      // 기본정보
      address: view.address,
      officePhone: view.officePhone,
      officePhone2: view.officePhone2,

      // 숫자
      totalBuildings: view.totalBuildings,
      totalFloors: view.totalFloors,
      totalHouseholds: view.totalHouseholds,
      remainingHouseholds: view.remainingHouseholds,

      // 주차
      parkingType: view.parkingType,
      parkingCount: view.parkingCount,

      // 준공/등기/매매
      completionDateText: view.completionDateText,
      salePrice: view.salePrice,
      registry: view.registry,
      slopeGrade: view.slopeGrade,
      structureGrade: view.structureGrade,

      // 구조 라인
      unitLines: view.unitLines,

      // 옵션
      options: view.options,
      optionEtc: view.optionEtc,

      // 메모 + 탭
      publicMemo: view.publicMemo,
      secretMemo: view.secretMemo,
      memoTab,
      setMemoTab,

      // 면적 타이틀/값
      exclusiveArea: view.exclusiveArea,
      realArea: view.realArea,
      extraExclusiveAreas: view.extraExclusiveAreas,
      extraRealAreas: view.extraRealAreas,
      baseAreaTitleView: view.baseAreaTitleView,
      extraAreaTitlesView: view.extraAreaTitlesView,
    }),
    [
      view,
      pinKind,
      preferCards,
      cardsHydrated,
      filesHydrated,
      imagesProp,
      memoTab,
      setMemoTab,
    ]
  );

  return f;
}
