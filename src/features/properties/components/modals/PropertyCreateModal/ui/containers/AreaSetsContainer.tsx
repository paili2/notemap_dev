"use client";

import AreaSetsSection from "../../../../sections/AreaSetsSection/AreaSetsSection";
import type { AreaSet as StrictAreaSet } from "../../../../sections/AreaSetsSection/types";

/** 느슨한 AreaSet: 일부 필드가 비어있을 수 있음 */
type LooseAreaSet = Partial<
  Pick<
    StrictAreaSet,
    | "title"
    | "exMinM2"
    | "exMaxM2"
    | "exMinPy"
    | "exMaxPy"
    | "realMinM2"
    | "realMaxM2"
    | "realMinPy"
    | "realMaxPy"
  >
>;

/** ⛑ 느슨/엄격 → 엄격 변환(undefined를 ""로 보정) */
const toStrictAreaSet = (raw: LooseAreaSet | StrictAreaSet): StrictAreaSet => ({
  title: String((raw as any)?.title ?? ""),
  exMinM2: String((raw as any)?.exMinM2 ?? ""),
  exMaxM2: String((raw as any)?.exMaxM2 ?? ""),
  exMinPy: String((raw as any)?.exMinPy ?? ""),
  exMaxPy: String((raw as any)?.exMaxPy ?? ""),
  realMinM2: String((raw as any)?.realMinM2 ?? ""),
  realMaxM2: String((raw as any)?.realMaxM2 ?? ""),
  realMinPy: String((raw as any)?.realMinPy ?? ""),
  realMaxPy: String((raw as any)?.realMaxPy ?? ""),
});

export default function AreaSetsContainer({
  form,
}: {
  form: {
    // 폼 쪽은 느슨/엄격 모두 받을 수 있도록
    baseAreaSet: LooseAreaSet | StrictAreaSet;
    setBaseAreaSet: (v: any) => void;
    extraAreaSets: Array<LooseAreaSet | StrictAreaSet>;
    setExtraAreaSets: (v: any[]) => void;
  };
}) {
  // 섹션이 요구하는 엄격 타입으로 어댑팅
  const strictBase = toStrictAreaSet(form.baseAreaSet);
  const strictExtras = (
    Array.isArray(form.extraAreaSets) ? form.extraAreaSets : []
  ).map(toStrictAreaSet);

  // 섹션 setter를 폼 setter에 포워딩(폼의 내부 타입과 상관없이 그대로 전달)
  const handleSetBase = (v: StrictAreaSet) => form.setBaseAreaSet(v);
  const handleSetExtras = (arr: StrictAreaSet[]) => form.setExtraAreaSets(arr);

  return (
    <AreaSetsSection
      baseAreaSet={strictBase}
      setBaseAreaSet={handleSetBase}
      extraAreaSets={strictExtras}
      setExtraAreaSets={handleSetExtras}
    />
  );
}
