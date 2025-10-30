"use client";

import { useMemo, useCallback } from "react";
import { useHeaderFields } from "./slices/useHeaderFields";
import { useBasicInfo } from "./slices/useBasicInfo";
import { useNumbers } from "./slices/useNumbers"; // ⬅ 총개동/총층수/총세대/잔여세대 상태 포함
import { useParking } from "./slices/useParking";
import { useGrades } from "./slices/useGrades";
import { useAspects } from "./slices/useAspects";
import { useAreaSets } from "./slices/useAreaSets";
import { useUnitLines } from "./slices/useUnitLines";
import { useOptionsMemos } from "./slices/useOptionsMemos";
import { useCreateValidation } from "../useCreateValidation";

// NOTE: 프로젝트마다 경로가 다를 수 있음.
// properties 쪽 dtoUtils에 sanitizeAreaGroups가 있다면 그쪽으로 경로를 맞추는 걸 권장.
import { sanitizeAreaGroups } from "@/features/map/components/MapCreateModalHost/dtoUtils";

type Args = { initialAddress?: string };

/**
 * useCreateForm
 * - 각 슬라이스 state/actions를 납작하게 병합하여 한 번에 노출
 * - 저장 가능 여부 isSaveEnabled 도 반환
 * - 면적 base+extras 합친 areaSetsCombined, 정규화된 areaGroups, on-demand 계산기 getAreaGroups 제공
 * - ✅ Numbers 슬라이스(총개동/총층수/총세대/잔여세대)를 포함하므로 새 필드들이 payload에 실릴 준비 완료
 */
export function useCreateForm({ initialAddress }: Args) {
  // 1) 슬라이스 합류
  const header = useHeaderFields();
  const basic = useBasicInfo({ initialAddress });
  const nums = useNumbers(); // ⬅ totalBuildings / totalFloors / totalHouseholds / remainingHouseholds
  const parking = useParking(); // parkingType, totalParkingSlots, parkingTypeId, registrationTypeId
  const grades = useGrades();
  const aspects = useAspects();
  const areas = useAreaSets();
  const units = useUnitLines();
  const opts = useOptionsMemos();

  // 2) 유효성: 슬라이스 state만 합쳐서 전달
  const { isSaveEnabled } = useCreateValidation({
    ...header.state,
    ...basic.state,
    ...nums.state, // ⬅ 새 숫자 필드들 포함
    ...parking.state, // totalParkingSlots 포함
    ...grades.state,
    ...aspects.state,
    ...areas.state,
    ...units.state,
    ...opts.state,
  });

  // 3) areaSets 파생값: base + extra 통합
  const areaSetsCombined = useMemo(() => {
    const base = (areas.state as any)?.baseAreaSet;
    const extras = (areas.state as any)?.extraAreaSets;
    const list = [base, ...(Array.isArray(extras) ? extras : [])].filter(
      Boolean
    );
    return list;
  }, [areas.state]);

  // 4) areaGroups (DTO 최종형) + on-demand 계산기
  const areaGroups = useMemo(
    () => sanitizeAreaGroups(areaSetsCombined),
    [areaSetsCombined]
  );
  const getAreaGroups = useCallback(
    () => sanitizeAreaGroups(areaSetsCombined),
    [areaSetsCombined]
  );

  // 5) 병합 반환
  return useMemo(() => {
    const noop = (() => {}) as any;

    // buildingType은 Basic 슬라이스에서 보통 관리
    const buildingType = (basic.state as any).buildingType ?? null;
    const setBuildingType = (basic.actions as any).setBuildingType ?? noop;

    // registrationTypeId / parkingTypeId는 Parking 슬라이스에서 관리
    const registrationTypeId =
      (parking.state as any).registrationTypeId ?? null;
    const setRegistrationTypeId =
      (parking.actions as any).setRegistrationTypeId ?? noop;

    const parkingTypeId = (parking.state as any).parkingTypeId ?? null;
    const setParkingTypeId = (parking.actions as any).setParkingTypeId ?? noop;

    return {
      // actions
      ...header.actions,
      ...basic.actions,
      ...nums.actions, // ⬅ 총개동/총층수/총세대/잔여세대 setter 노출
      ...parking.actions,
      ...grades.actions,
      ...aspects.actions,
      ...areas.actions,
      ...units.actions,
      ...opts.actions,

      // state
      ...header.state,
      ...basic.state,
      ...nums.state, // ⬅ 총개동/총층수/총세대/잔여세대 값 노출
      ...parking.state,
      ...grades.state,
      ...aspects.state,
      ...areas.state,
      ...units.state,
      ...opts.state,

      // 브릿지 노출(타 프로젝트 호환 대비)
      buildingType,
      setBuildingType,
      registrationTypeId,
      setRegistrationTypeId,
      parkingTypeId,
      setParkingTypeId,

      // 면적 파생값
      areaSetsCombined,
      areaGroups,
      getAreaGroups,

      // 유효성
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
  ]);
}
