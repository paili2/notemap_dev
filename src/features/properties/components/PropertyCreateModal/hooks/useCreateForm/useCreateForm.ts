"use client";

import { useMemo } from "react";
import { useHeaderFields } from "./slices/useHeaderFields";
import { useBasicInfo } from "./slices/useBasicInfo";
import { useNumbers } from "./slices/useNumbers";
import { useParking } from "./slices/useParking";
import { useGrades } from "./slices/useGrades";
import { useAspects } from "./slices/useAspects";
import { useAreaSets } from "./slices/useAreaSets";
import { useUnitLines } from "./slices/useUnitLines";
import { useOptionsMemos } from "./slices/useOptionsMemos";
import { useCreateValidation } from "../useCreateValidation";

type Args = { initialAddress?: string };

export function useCreateForm({ initialAddress }: Args) {
  // 1) 각 슬라이스 상태/액션
  const header = useHeaderFields();
  const basic = useBasicInfo({ initialAddress });
  const nums = useNumbers();
  const parking = useParking();
  const grades = useGrades();
  const aspects = useAspects();
  const areas = useAreaSets();
  const units = useUnitLines();
  const opts = useOptionsMemos();

  // 2) 유효성 (각 슬라이스의 state만 모아 전달)
  const { isSaveEnabled } = useCreateValidation({
    ...header.state,
    ...basic.state,
    ...nums.state,
    ...parking.state,
    ...grades.state,
    ...aspects.state,
    ...areas.state,
    ...units.state,
    ...opts.state,
  });

  // 3) 한 번에 쓰기 좋게 합쳐서 반환 (참조 안정성 유지)
  return useMemo(
    () => ({
      // 개별 슬라이스의 state/액션을 납작하게 노출
      ...header.actions,
      ...basic.actions,
      ...nums.actions,
      ...parking.actions,
      ...grades.actions,
      ...aspects.actions,
      ...areas.actions,
      ...units.actions,
      ...opts.actions,

      // state도 필요한 곳에서 바로 읽을 수 있게 노출
      ...header.state,
      ...basic.state,
      ...nums.state,
      ...parking.state,
      ...grades.state,
      ...aspects.state,
      ...areas.state,
      ...units.state,
      ...opts.state,

      // 유효성
      isSaveEnabled,
    }),
    [
      header,
      basic,
      nums,
      parking,
      grades,
      aspects,
      areas,
      units,
      opts,
      isSaveEnabled,
    ]
  );
}
