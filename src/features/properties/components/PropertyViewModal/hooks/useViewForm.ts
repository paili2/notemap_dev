"use client";

import { useMemo, useState } from "react";
import { toYMDFlexible } from "@/lib/dateUtils";
import { useViewImagesHydration } from "../hooks/useViewImagesHydration";
import { extractViewMeta } from "../utils/extractViewMeta";
import type { MemoTab, PropertyViewDetails } from "../types";

/* ───────── 헬퍼: 전화/문자 정규화 ───────── */
const norm = (v?: string | null) => {
  const s = (v ?? "").trim();
  if (!s) return "";
  const low = s.toLowerCase();
  if (low === "null" || low === "undefined" || s === "-") return "";
  return s;
};

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

  // 메타 파생 (pinKind / 면적 타이틀)
  const { pinKind, baseAreaTitleView, extraAreaTitlesView } = extractViewMeta(
    (data ?? {}) as any
  );

  // 안전한 프리미티브 추출 + 최소 가공
  const view = useMemo(() => {
    const d = (data ?? {}) as PropertyViewDetails;

    // 준공일: 값이 있을 때만 포맷
    const completionDateText =
      d?.completionDate && String(d.completionDate).trim() !== ""
        ? toYMDFlexible(d.completionDate, { utc: true })
        : undefined;

    // ✅ 총 주차대수: 우선 totalParkingSlots, 없으면 레거시 parkingCount 사용
    const totalParkingSlots =
      (d as any)?.totalParkingSlots ?? (d as any)?.parkingCount ?? undefined;

    /* ✅ 전화번호: 중복제거(Set) 없이 각각 정규화만 적용 */
    const officePhone = norm(
      (d as any)?.officePhone ??
        (d as any)?.contactMainPhone ??
        (d as any)?.contactPhone ??
        ""
    );
    const officePhone2 = norm(
      (d as any)?.officePhone2 ??
        (d as any)?.contactSubPhone ??
        (d as any)?.contactPhone2 ??
        ""
    );

    // ✅ 최저 실입(정수, 만원 단위)
    const minRealMoveInCost =
      d?.minRealMoveInCost === null || d?.minRealMoveInCost === undefined
        ? undefined
        : Number(d.minRealMoveInCost);

    return {
      // 헤더/기본
      title: d.title ?? "",
      listingStars: d.listingStars ?? 0,
      elevator: d.elevator as "O" | "X" | undefined,
      address: d.address ?? "",
      officePhone,
      officePhone2,

      // 숫자
      totalBuildings: d.totalBuildings,
      totalFloors: d.totalFloors,
      totalHouseholds: d.totalHouseholds,
      remainingHouseholds: d.remainingHouseholds,

      // 주차/등급/등기/준공
      parkingType: (d as any)?.parkingType,
      totalParkingSlots,
      slopeGrade: d.slopeGrade,
      structureGrade: d.structureGrade,
      registry: d.registry,
      completionDateText,

      // ✅ 금액
      minRealMoveInCost,

      // 구조 라인
      unitLines: Array.isArray(d.unitLines) ? d.unitLines : undefined,

      // 옵션/메모
      options: Array.isArray(d.options) ? d.options : undefined,
      optionEtc: d.optionEtc,
      publicMemo: d.publicMemo,
      secretMemo: d.secretMemo,

      // 면적 (AreaSetsViewContainer가 그대로 사용)
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
      elevator: view.elevator,
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
      totalParkingSlots: view.totalParkingSlots,

      // 준공/등기/등급/최저실입
      completionDateText: view.completionDateText,
      registry: view.registry,
      slopeGrade: view.slopeGrade,
      structureGrade: view.structureGrade,
      minRealMoveInCost: view.minRealMoveInCost, // ✅ 노출

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
    ]
  );

  return f;
}
