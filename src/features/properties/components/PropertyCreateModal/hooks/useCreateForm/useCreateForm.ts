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

/**
 * 폼을 슬라이스별 상태/액션으로 구성해서 한 번에 노출해 주는 훅.
 * - 각 슬라이스의 state와 actions를 납작하게 merge
 * - 저장 가능 여부(isSaveEnabled)만 별도로 계산해 노출
 */
export function useCreateForm({ initialAddress }: Args) {
  // 1) 슬라이스 호출
  const header = useHeaderFields();
  const basic = useBasicInfo({ initialAddress });
  const nums = useNumbers();
  const parking = useParking();
  const grades = useGrades();
  const aspects = useAspects();
  const areas = useAreaSets();
  const units = useUnitLines();
  const opts = useOptionsMemos();

  // 2) 유효성 계산 (슬라이스 state만 합쳐 전달)
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

  // 3) state + actions 합쳐서 안정적 참조로 반환
  return useMemo(() => {
    // ── 브릿지 필드: 슬라이스에 존재하면 연결, 없으면 안전 기본값/NO-OP ──
    const noop = (() => {}) as any;

    // buildingType은 보통 Basic 슬라이스에서 관리한다고 가정
    const buildingType = (basic.state as any).buildingType ?? null;
    const setBuildingType = (basic.actions as any).setBuildingType ?? noop;

    // registrationTypeId / parkingTypeId 는 보통 Parking 슬라이스에서 관리
    const registrationTypeId =
      (parking.state as any).registrationTypeId ?? null;
    const setRegistrationTypeId =
      (parking.actions as any).setRegistrationTypeId ?? noop;

    const parkingTypeId = (parking.state as any).parkingTypeId ?? null;
    const setParkingTypeId = (parking.actions as any).setParkingTypeId ?? noop;

    return {
      // actions 먼저 펼치기
      ...header.actions,
      ...basic.actions,
      ...nums.actions,
      ...parking.actions,
      ...grades.actions,
      ...aspects.actions,
      ...areas.actions,
      ...units.actions,
      ...opts.actions,

      // state도 함께 노출
      ...header.state,
      ...basic.state,
      ...nums.state,
      ...parking.state, // parkingType/registrationType/parkingCount 등
      ...grades.state,
      ...aspects.state,
      ...areas.state,
      ...units.state,
      ...opts.state,

      // ✅ 신규 브릿지 노출(없는 프로젝트에서도 타입 보장)
      buildingType,
      setBuildingType,
      registrationTypeId,
      setRegistrationTypeId,
      parkingTypeId,
      setParkingTypeId,

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
  ]);
}
