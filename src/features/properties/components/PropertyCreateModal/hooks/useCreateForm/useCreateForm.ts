"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
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
import { getPinDraftDetailOnce } from "@/shared/api/pins"; // ✅ 변경된 import

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
  // ✅ pinDraftId로부터 매물명 / 분양사무실 번호 / 주소 프리필
  //   - 생성 모달이 처음 열렸을 때 한 번만 실행
  // ─────────────────────────────────────────────────────────
  const didHydrateFromDraftRef = useRef(false);

  useEffect(() => {
    // 이미 한 번 채웠으면 다시 안 함
    if (didHydrateFromDraftRef.current) return;

    // id 없으면 아무 것도 안 함
    if (pinDraftId == null || pinDraftId === "") return;

    // 숫자로 변환 안 되면 방어
    const idNum = Number(pinDraftId);
    if (!Number.isFinite(idNum)) {
      console.warn("[useCreateForm] invalid pinDraftId:", pinDraftId);
      return;
    }

    // 🔑 여기서 바로 true 로 올려서 StrictMode 2회 실행 시 중복 호출 방지
    didHydrateFromDraftRef.current = true;

    let aborted = false;

    (async () => {
      try {
        const draft = await getPinDraftDetailOnce(idNum);
        if (aborted || !draft) return;

        const name = (draft.name ?? "").trim();
        const phone = (draft.contactMainPhone ?? "").trim();
        const addressLine = (draft.addressLine ?? "").trim();

        const headerState: any = header.state;
        const headerActions: any = header.actions;
        const basicState: any = basic.state;
        const basicActions: any = basic.actions;

        // 매물명: 헤더 title이 비어 있을 때만 세팅
        if (
          name &&
          !headerState.title &&
          typeof headerActions.setTitle === "function"
        ) {
          headerActions.setTitle(name);
        }

        // 분양사무실 대표번호: officePhone 비어 있을 때만 세팅
        if (
          phone &&
          !basicState.officePhone &&
          typeof basicActions.setOfficePhone === "function"
        ) {
          basicActions.setOfficePhone(phone);
        }

        // 주소: address 비어 있을 때만 세팅
        if (
          addressLine &&
          !basicState.address &&
          typeof basicActions.setAddress === "function"
        ) {
          basicActions.setAddress(addressLine);
        }
      } catch (err) {
        if (aborted) return;
        console.error("[useCreateForm] getPinDraftDetailOnce failed", err);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [pinDraftId, header, basic]);

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

  const noop = (() => {}) as any;
  const setIsNew =
    (grades.actions as any)?.setIsNew ??
    (grades.actions as any)?.set_isNew ??
    noop;
  const setIsOld =
    (grades.actions as any)?.setIsOld ??
    (grades.actions as any)?.set_isOld ??
    noop;

  const selectNew = useCallback(() => {
    setIsNew(true);
    setIsOld(false);
  }, [setIsNew, setIsOld]);

  const selectOld = useCallback(() => {
    setIsNew(false);
    setIsOld(true);
  }, [setIsNew, setIsOld]);

  const isSaveEnabled = rawIsSaveEnabled;

  return useMemo(() => {
    const noopLocal = (() => {}) as any;

    const buildingType = (basic.state as any).buildingType ?? null;
    const setBuildingType = (basic.actions as any).setBuildingType ?? noopLocal;

    const registrationTypeId =
      (parking.state as any).registrationTypeId ?? null;
    const setRegistrationTypeId =
      (parking.actions as any).setRegistrationTypeId ?? noopLocal;

    return {
      ...header.actions,
      ...basic.actions,
      ...nums.actions,
      ...parking.actions,
      ...grades.actions,
      ...aspects.actions,
      ...areas.actions,
      ...units.actions,
      ...opts.actions,

      ...header.state,
      ...basic.state,
      ...nums.state,
      ...parking.state,
      ...grades.state,
      ...aspects.state,
      ...areas.state,
      ...units.state,
      ...opts.state,

      buildingType,
      setBuildingType,
      registrationTypeId,
      setRegistrationTypeId,

      areaSetsCombined,
      areaGroups,
      getAreaGroups,

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
    areaSetsCombined,
    areaGroups,
    selectNew,
    selectOld,
    isSaveEnabled,
  ]);
}
