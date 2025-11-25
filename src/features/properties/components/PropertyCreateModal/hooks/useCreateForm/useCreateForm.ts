"use client";

import { useMemo, useCallback } from "react";
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

type Args = {
  initialAddress?: string;
  /** MapHome → ModalsHost → PropertyCreateModalBody 에서 내려주는 draftId */
  pinDraftId?: number | string | null;
};

export function useCreateForm({ initialAddress, pinDraftId }: Args) {
  const header = useHeaderFields();
  const basic = useBasicInfo({ initialAddress });
  const nums = useNumbers();
  const parking = useParking();
  const grades = useGrades();
  const aspects = useAspects();
  const areas = useAreaSets();
  const units = useUnitLines();
  const opts = useOptionsMemos();

  // ─────────────────────────────────────────────────────────
  // ① 기본 저장 가능 여부 (전체 검증용)
  // ─────────────────────────────────────────────────────────
  const { isSaveEnabled: rawIsSaveEnabled } = useCreateValidation({
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
  // ✅ 신축/구옥 토글 액션 얻기 (자동 기본값은 세팅하지 않음)
  // ─────────────────────────────────────────────────────────
  const noop = (() => {}) as any;
  const setIsNew =
    (grades.actions as any)?.setIsNew ??
    (grades.actions as any)?.set_isNew ??
    noop;
  const setIsOld =
    (grades.actions as any)?.setIsOld ??
    (grades.actions as any)?.set_isOld ??
    noop;

  // 상호배타 선택 유틸 (UI에서 바로 호출)
  const selectNew = useCallback(() => {
    setIsNew(true);
    setIsOld(false);
  }, [setIsNew, setIsOld]);

  const selectOld = useCallback(() => {
    setIsNew(false);
    setIsOld(true);
  }, [setIsNew, setIsOld]);

  // ─────────────────────────────────────────────────────────
  // ✅ 저장 가능 여부: 답사예정 특수 로직은 Modal 쪽에서 처리
  // ─────────────────────────────────────────────────────────
  const isSaveEnabled = rawIsSaveEnabled;

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
      ...header.actions,
      ...basic.actions,
      ...nums.actions,
      ...parking.actions,
      ...grades.actions,
      ...aspects.actions,
      ...areas.actions,
      ...units.actions,
      ...opts.actions,

      // state
      ...header.state,
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

      // ✅ 최종 저장 가능 여부 (답사예정이면 완화된 조건 적용)
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
    areaSetsCombined,
    areaGroups,
    selectNew,
    selectOld,
    isSaveEnabled,
  ]);
}
