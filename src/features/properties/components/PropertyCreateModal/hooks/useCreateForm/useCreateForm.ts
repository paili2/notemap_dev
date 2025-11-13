"use client";

import { useMemo, useCallback, useEffect } from "react";
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
import { sanitizeAreaGroups } from "@/features/properties/lib/forms/dtoUtils";

type Args = { initialAddress?: string };

export function useCreateForm({ initialAddress }: Args) {
  const header = useHeaderFields();
  const basic = useBasicInfo({ initialAddress });
  const nums = useNumbers();
  const parking = useParking();
  const grades = useGrades();
  const aspects = useAspects();
  const areas = useAreaSets();
  const units = useUnitLines();
  const opts = useOptionsMemos();

  // 저장 가능 여부 (parkingGrade 포함해 전달)
  const { isSaveEnabled } = useCreateValidation({
    ...header.state, // ⬅ title, parkingGrade, (isNew/isOld가 들어온다면 함께 전달)
    ...basic.state,
    ...nums.state,
    ...parking.state,
    ...grades.state,
    ...aspects.state,
    ...areas.state,
    ...units.state,
    ...opts.state,
  });

  const areaSetsCombined = useMemo(() => {
    const base = (areas.state as any)?.baseAreaSet;
    const extras = (areas.state as any)?.extraAreaSets;
    return [base, ...(Array.isArray(extras) ? extras : [])].filter(Boolean);
  }, [areas.state]);

  const areaGroups = useMemo(
    () => sanitizeAreaGroups(areaSetsCombined),
    [areaSetsCombined]
  );
  const getAreaGroups = useCallback(
    () => sanitizeAreaGroups(areaSetsCombined),
    [areaSetsCombined]
  );

  // ─────────────────────────────────────────────────────────
  // ✅ 신축/구옥 기본값 보정: 기본 "신축=true, 구옥=false"
  //    - 헤더 슬라이스에 isNew/isOld 또는 is_new/is_old 중 아무거나 들어와도 대응
  //    - 둘 다 undefined 이거나 둘 다 false면 신축으로 강제 세팅
  // ─────────────────────────────────────────────────────────
  const noop = (() => {}) as any;
  const setIsNew =
    (header.actions as any)?.setIsNew ??
    (header.actions as any)?.set_isNew ??
    noop;
  const setIsOld =
    (header.actions as any)?.setIsOld ??
    (header.actions as any)?.set_isOld ??
    noop;

  useEffect(() => {
    const hs: any = header.state ?? {};
    const newVal =
      typeof hs.isNew === "boolean"
        ? hs.isNew
        : (hs.is_new as boolean | undefined);
    const oldVal =
      typeof hs.isOld === "boolean"
        ? hs.isOld
        : (hs.is_old as boolean | undefined);

    const hasNew = typeof newVal === "boolean";
    const hasOld = typeof oldVal === "boolean";

    // 둘 다 비어있으면 기본 신축
    if (!hasNew && !hasOld) {
      setIsNew(true);
      setIsOld(false);
      return;
    }
    // 둘 다 false라면(무선택 상태) 기본 신축
    if (newVal === false && oldVal === false) {
      setIsNew(true);
      setIsOld(false);
      return;
    }
    // 값이 하나라도 명시돼 있으면 그대로 둔다(드래프트/수정 진입 보호)
  }, [header.state, setIsNew, setIsOld]);

  // 상호배타 선택 유틸 (UI에서 바로 호출)
  const selectNew = useCallback(() => {
    setIsNew(true);
    setIsOld(false);
  }, [setIsNew, setIsOld]);

  const selectOld = useCallback(() => {
    setIsNew(false);
    setIsOld(true);
  }, [setIsNew, setIsOld]);

  return useMemo(() => {
    const noopLocal = (() => {}) as any;

    const buildingType = (basic.state as any).buildingType ?? null;
    const setBuildingType = (basic.actions as any).setBuildingType ?? noopLocal;

    const registrationTypeId =
      (parking.state as any).registrationTypeId ?? null;
    const setRegistrationTypeId =
      (parking.actions as any).setRegistrationTypeId ?? noopLocal;

    const parkingTypeId = (parking.state as any).parkingTypeId ?? null;
    const setParkingTypeId =
      (parking.actions as any).setParkingTypeId ?? noopLocal;

    return {
      // actions
      ...header.actions, // ⬅ setParkingGrade, setIsNew/setIsOld 등
      ...basic.actions,
      ...nums.actions,
      ...parking.actions,
      ...grades.actions,
      ...aspects.actions,
      ...areas.actions,
      ...units.actions,
      ...opts.actions,

      // state
      ...header.state, // ⬅ parkingGrade, isNew/isOld 포함
      ...basic.state,
      ...nums.state,
      ...parking.state,
      ...grades.state,
      ...aspects.state,
      ...areas.state,
      ...units.state,
      ...opts.state,

      // 호환 브릿지
      buildingType,
      setBuildingType,
      registrationTypeId,
      setRegistrationTypeId,
      parkingTypeId,
      setParkingTypeId,

      // 면적 파생
      areaSetsCombined,
      areaGroups,
      getAreaGroups,

      // ✅ 상호배타 토글(신축/구옥)
      selectNew,
      selectOld,

      isSaveEnabled,
    };
  }, [
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
    areaSetsCombined,
    areaGroups,
    selectNew,
    selectOld,
  ]);
}
