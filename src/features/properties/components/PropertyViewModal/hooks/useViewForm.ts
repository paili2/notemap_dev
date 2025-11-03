"use client";

import { useMemo, useState } from "react";
import { toYMDFlexible } from "@/lib/dateUtils";
import { useViewImagesHydration } from "../hooks/useViewImagesHydration";
import { extractViewMeta } from "../utils/extractViewMeta";
import type { MemoTab, PropertyViewDetails } from "../types";

/* ───────── 헬퍼 ───────── */
const norm = (v?: string | null) => {
  const s = (v ?? "").trim();
  if (!s) return "";
  const low = s.toLowerCase();
  if (low === "null" || low === "undefined" || s === "-") return "";
  return s;
};

type UnitView = {
  rooms: number;
  baths: number;
  hasLoft: boolean;
  hasTerrace: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
};

const asNumber = (x: any): number | undefined =>
  typeof x === "number"
    ? x
    : Number.isFinite(Number(x))
    ? Number(x)
    : undefined;

const asBool = (x: any): boolean =>
  x === true || x === "true" || x === 1 || x === "1" || x === "Y" || x === "y";

/** 여러 후보 경로에서 units 추출 */
function pickUnits(raw: any): any[] | undefined {
  if (!raw) return undefined;
  return (
    raw.units ??
    raw.unitList ??
    raw.structureUnits ??
    raw.structure?.units ??
    raw.view?.units ??
    raw.details?.units ??
    undefined
  );
}

/** unitLines(구버전) -> units(신버전) 변환 폴백 */
function convertLinesToUnits(lines: any[] | undefined): UnitView[] {
  if (!Array.isArray(lines)) return [];
  return lines.map((l) => ({
    rooms: asNumber(l?.rooms) ?? 0,
    baths: asNumber(l?.baths) ?? 0,
    hasLoft: asBool(l?.duplex),
    hasTerrace: asBool(l?.terrace),
    // 가격 정보가 없을 수 있음
    minPrice: asNumber(l?.minPrice),
    maxPrice: asNumber(l?.maxPrice),
  }));
}

/** View 전용 훅 */
export function useViewForm({
  open,
  data,
}: {
  open: boolean;
  data: PropertyViewDetails | null | undefined;
}) {
  const [memoTab, setMemoTab] = useState<MemoTab>("KN");

  const pinId = (data as any)?.pinId ?? (data as any)?.id ?? null;

  const { preferCards, cardsHydrated, filesHydrated, legacyImagesHydrated } =
    useViewImagesHydration({ open, data: data as any, pinId });

  const imagesProp = preferCards ? undefined : legacyImagesHydrated;

  const { pinKind, baseAreaTitleView, extraAreaTitlesView } = extractViewMeta(
    (data ?? {}) as any
  );

  const view = useMemo(() => {
    const d = (data ?? {}) as PropertyViewDetails;

    const completionDateText =
      d?.completionDate && String(d.completionDate).trim() !== ""
        ? toYMDFlexible(d.completionDate, { utc: true })
        : undefined;

    const totalParkingSlots =
      (d as any)?.totalParkingSlots ?? (d as any)?.parkingCount ?? undefined;

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

    const minRealMoveInCost =
      d?.minRealMoveInCost === null || d?.minRealMoveInCost === undefined
        ? undefined
        : Number(d.minRealMoveInCost);

    const parkingGradeRaw: any = (d as any)?.parkingGrade;
    const parkingGrade = Number.isFinite(Number(parkingGradeRaw))
      ? Math.max(0, Math.min(5, Math.round(Number(parkingGradeRaw))))
      : undefined;

    // 🔎 units 추출(여러 경로) → 정규화
    const picked = pickUnits(d);
    const normalizedUnits: UnitView[] = Array.isArray(picked)
      ? picked.map((u) => ({
          rooms: asNumber(u?.rooms) ?? 0,
          baths: asNumber(u?.baths) ?? 0,
          // 백엔드가 hasLoft/hasTerrace 또는 duplex/terrace 로 보낼 수 있음
          hasLoft: asBool(u?.hasLoft ?? u?.duplex),
          hasTerrace: asBool(u?.hasTerrace ?? u?.terrace),
          minPrice:
            u?.minPrice === null || u?.minPrice === undefined
              ? undefined
              : asNumber(u?.minPrice),
          maxPrice:
            u?.maxPrice === null || u?.maxPrice === undefined
              ? undefined
              : asNumber(u?.maxPrice),
        }))
      : [];

    // 폴백: units가 비었으면 unitLines를 변환해서라도 보여주기
    const units =
      normalizedUnits.length > 0
        ? normalizedUnits
        : convertLinesToUnits((d as any)?.unitLines);

    // 디버그(필요시 콘솔에서 확인)
    if (typeof window !== "undefined") {
      console.debug("[useViewForm] units.len:", units.length, {
        sample: units[0],
        pickedKeys: Object.keys(d || {}).filter((k) =>
          /(unit|structure)/i.test(k)
        ),
      });
    }

    return {
      // 헤더/기본
      title: d.title ?? "",
      parkingGrade,
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

      // 구조
      unitLines: Array.isArray((d as any)?.unitLines)
        ? (d as any).unitLines
        : undefined,
      units, // ← 항상 배열(없어도 [])

      // 옵션/메모
      options: Array.isArray(d.options) ? d.options : undefined,
      optionEtc: (d as any)?.optionEtc,
      publicMemo: d.publicMemo,
      secretMemo: d.secretMemo,

      // 면적
      exclusiveArea: (d as any)?.exclusiveArea,
      realArea: (d as any)?.realArea,
      extraExclusiveAreas: (d as any)?.extraExclusiveAreas,
      extraRealAreas: (d as any)?.extraRealAreas,
      baseAreaTitleView,
      extraAreaTitlesView,
    };
  }, [data, baseAreaTitleView, extraAreaTitlesView]);

  const f = useMemo(
    () => ({
      // 헤더
      title: view.title,
      parkingGrade: view.parkingGrade,
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
      minRealMoveInCost: view.minRealMoveInCost,

      // 구조
      unitLines: view.unitLines,
      units: view.units, // 항상 배열

      // 옵션
      options: view.options,
      optionEtc: view.optionEtc,

      // 메모 + 탭
      publicMemo: view.publicMemo,
      secretMemo: view.secretMemo,
      memoTab,
      setMemoTab,

      // 면적
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
