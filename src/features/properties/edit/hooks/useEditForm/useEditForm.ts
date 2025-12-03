"use client";

import { useCallback, useMemo, useState } from "react";
import { filled } from "@/features/properties/lib/validators";

import { EMPTY_ASPECTS } from "./constants";

import {
  BuildingType,
  Grade,
  normalizeBuildingTypeLabelToEnum,
} from "@/features/properties/types/property-domain";
import { RegistryUi } from "./registry";
import { useInjectInitialData } from "./useInjectInitialData";
import { useAreaSets } from "./useAreaSets";
import { useAspectsState } from "./useAspectsState";
import { useUnitLines } from "./useUnitLines";
import { StarStr } from "@/features/properties/types/property-dto";
import { PinKind, UseEditFormArgs } from "../../types/editForm.types";

type BuildingGrade = "" | "new" | "old";

export function useEditForm({ initialData }: UseEditFormArgs) {
  /* ========== 기본 상태 ========== */
  const [pinKind, setPinKind] = useState<PinKind>("1room");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState<string>("");
  const [officePhone, setOfficePhone] = useState<string>("");
  const [officePhone2, setOfficePhone2] = useState<string>("");
  const [officeName, setOfficeName] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [floor, setFloor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [structure, setStructure] = useState("3룸");

  /** 방향 관련 상태/헬퍼 */
  const {
    aspects,
    setAspects,
    aspectsTouchedRef,
    aspectsTouched,
    setAspectsTouched,
    markAspectsTouched,
    addAspect,
    removeAspect,
    setAspectDir,
    aspectsValid,
    buildOrientation,
  } = useAspectsState();

  // ⭐ 면적 세트 관련 훅
  const {
    baseAreaSet,
    extraAreaSets,
    areaSetsTouched,
    setBaseAreaSet,
    setExtraAreaSets,
    setAreaSetsTouched,
    hasExclusiveAny,
    hasRealAny,
    packAreas,
  } = useAreaSets();

  // ⭐ 매물평점(별 1~5, 공백 허용)
  const [parkingGrade, setParkingGrade] = useState<StarStr>("");

  /** ✅ 주차유형: string | null 로 관리 */
  const [parkingType, setParkingType] = useState<string | null>(null);

  const [totalParkingSlots, setTotalParkingSlots] = useState<string>("");
  const [completionDate, setCompletionDate] = useState("");

  const [salePriceRaw, setSalePriceRaw] = useState<string | number | null>("");

  const setSalePrice = useCallback(
    (v: string | number | null) => setSalePriceRaw(v),
    []
  );

  /** 🔥 헤더 R 인풋과 연결될 리베이트 텍스트(만원 단위) */
  const [rebateText, setRebateText] = useState<string>("");

  const [elevator, setElevator] = useState<"O" | "X" | undefined>();

  const [buildingGrade, setBuildingGrade] = useState<BuildingGrade>("");

  const [registry, setRegistry] = useState<RegistryUi>(undefined);

  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

  const [totalBuildings, setTotalBuildings] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [totalHouseholds, setTotalHouseholds] = useState("");
  const [remainingHouseholds, setRemainingHouseholds] = useState("");

  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");

  /** 유닛 라인(방/욕실/복층/테라스) */
  const {
    unitLines,
    setUnitLines,
    addLineFromPreset,
    addEmptyLine,
    updateLine,
    removeLine,
  } = useUnitLines();

  /** ✅ buildingType: initialData 기반으로 초기값 세팅 */
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);

  /* ========== reset ========== */
  const reset = useCallback(() => {
    aspectsTouchedRef.current = false;
    setAspectsTouched(false);
    setAreaSetsTouched(false);

    setPinKind("1room");
    setTitle("");
    setAddress("");
    setOfficePhone("");
    setOfficePhone2("");
    setOfficeName("");
    setMoveIn("");
    setFloor("");
    setRoomNo("");
    setStructure("3룸");
    setAspects(EMPTY_ASPECTS);
    setParkingGrade("");
    setParkingType(null);
    setTotalParkingSlots("");
    setCompletionDate("");
    setSalePrice("");
    setBaseAreaSet({
      title: "",
      exMinM2: "",
      exMaxM2: "",
      exMinPy: "",
      exMaxPy: "",
      realMinM2: "",
      realMaxM2: "",
      realMinPy: "",
      realMaxPy: "",
    });
    setExtraAreaSets([]);
    setElevator("O");
    setBuildingGrade("");
    setRegistry(undefined);
    setSlopeGrade(undefined);
    setStructureGrade(undefined);
    setTotalBuildings("");
    setTotalFloors("");
    setTotalHouseholds("");
    setRemainingHouseholds("");
    setOptions([]);
    setEtcChecked(false);
    setOptionEtc("");
    setPublicMemo("");
    setSecretMemo("");
    setUnitLines([]);
    setBuildingType(null);
    setRebateText("");
  }, [
    aspectsTouchedRef,
    setAspectsTouched,
    setAreaSetsTouched,
    setAspects,
    setBaseAreaSet,
    setExtraAreaSets,
    setUnitLines,
  ]);

  /* ========== 초기 주입 훅 사용 ========== */
  const apiForInjection = {
    // 플래그
    setAspectsTouched,
    setAreaSetsTouched,
    // 기본 필드
    setPinKind,
    setTitle,
    setAddress,
    setOfficePhone,
    setOfficePhone2,
    setOfficeName,
    setMoveIn,
    setFloor,
    setRoomNo,
    setStructure,
    // 평가/주차
    setParkingGrade,
    setParkingType,
    setTotalParkingSlots,
    setCompletionDate,
    setSalePrice,
    // 면적/건물
    setBaseAreaSet,
    setExtraAreaSets,
    setElevator,
    setBuildingGrade,
    setRegistry,
    setSlopeGrade,
    setStructureGrade,
    setTotalBuildings,
    setTotalFloors,
    setTotalHouseholds,
    setRemainingHouseholds,
    // 옵션/메모
    setOptions,
    setEtcChecked,
    setOptionEtc,
    setPublicMemo,
    setSecretMemo,
    // 유닛/빌딩
    setUnitLines,
    setBuildingType,
    setAspects,
    // 리베이트
    setRebateText,
    // registryOne alias
    setRegistryOne: setRegistry,
  } as const;

  const initialForPatch = useInjectInitialData({
    initialData,
    api: apiForInjection,
    aspectsTouchedRef,
  });

  /* ========== 파생값/유효성 ========== */
  const optionsValid = useMemo(
    () => options.length > 0 || (etcChecked && optionEtc.trim().length > 0),
    [options, etcChecked, optionEtc]
  );

  const isSaveEnabled = useMemo<boolean>(() => {
    const hasTitle = filled(title);
    const hasMainPhone = filled(officePhone);
    return hasTitle && hasMainPhone;
  }, [title, officePhone]);

  /* ========== 저장 헬퍼 ========== */
  const getParkingGradeNumber = useCallback(() => {
    if (!parkingGrade || !["1", "2", "3", "4", "5"].includes(parkingGrade))
      return undefined;
    return Number(parkingGrade);
  }, [parkingGrade]);

  /* ========== 반환 ========== */
  const state = useMemo(
    () => ({
      pinKind,
      title,
      address,
      officePhone,
      officePhone2,
      officeName,
      moveIn,
      floor,
      roomNo,
      structure,
      aspects,
      parkingGrade,
      parkingType,
      totalParkingSlots,
      completionDate,
      salePrice: salePriceRaw,
      baseAreaSet,
      extraAreaSets,
      elevator,
      registry,
      slopeGrade,
      structureGrade,
      totalBuildings,
      totalFloors,
      totalHouseholds,
      remainingHouseholds,
      options,
      etcChecked,
      optionEtc,
      publicMemo,
      secretMemo,
      unitLines,
      buildingType,
      buildingGrade,
      aspectsTouched,
      rebateText,
      areaSetsTouched,
      // 🔥 HeaderForm에서 바로 쓸 수 있게 alias 제공
      rebateRaw: rebateText,
    }),
    [
      pinKind,
      title,
      address,
      officePhone,
      officePhone2,
      officeName,
      moveIn,
      floor,
      roomNo,
      structure,
      aspects,
      parkingGrade,
      parkingType,
      totalParkingSlots,
      completionDate,
      salePriceRaw,
      baseAreaSet,
      extraAreaSets,
      elevator,
      registry,
      slopeGrade,
      structureGrade,
      totalBuildings,
      totalFloors,
      totalHouseholds,
      remainingHouseholds,
      options,
      etcChecked,
      optionEtc,
      publicMemo,
      secretMemo,
      unitLines,
      buildingType,
      buildingGrade,
      aspectsTouched,
      rebateText,
      areaSetsTouched,
    ]
  );

  const actions = useMemo(
    () => ({
      setPinKind,
      setTitle,
      setAddress,
      setOfficePhone,
      setOfficePhone2,
      setOfficeName,
      setMoveIn,
      setFloor,
      setRoomNo,
      setStructure,
      addAspect,
      removeAspect,
      setAspectDir,
      setAspects,
      setParkingGrade,
      setParkingType,
      setTotalParkingSlots,
      setCompletionDate,
      setSalePrice,
      setBaseAreaSet,
      setExtraAreaSets,
      setElevator,
      setRegistry,
      setSlopeGrade,
      setStructureGrade,
      setTotalBuildings,
      setTotalFloors,
      setTotalHouseholds,
      setRemainingHouseholds,
      setOptions,
      setEtcChecked,
      setOptionEtc,
      setPublicMemo,
      setSecretMemo,
      setUnitLines,
      addLineFromPreset,
      addEmptyLine,
      updateLine,
      removeLine,
      reset,
      setBuildingType,
      setBuildingGrade,
      setRebateText,
      // 🔥 HeaderForm용 alias
      setRebateRaw: (v: string) => setRebateText(v),
    }),
    [
      addAspect,
      removeAspect,
      setAspectDir,
      addLineFromPreset,
      addEmptyLine,
      updateLine,
      removeLine,
      reset,
      setBaseAreaSet,
      setExtraAreaSets,
    ]
  );

  const derived = useMemo(
    () => ({
      isSaveEnabled,
      hasExclusiveAny,
      hasRealAny,
      optionsValid,
      aspectsValid,
    }),
    [isSaveEnabled, hasExclusiveAny, hasRealAny, optionsValid, aspectsValid]
  );

  const helpers = useMemo(
    () => ({ buildOrientation, packAreas, getParkingGradeNumber }),
    [buildOrientation, packAreas, getParkingGradeNumber]
  );

  return {
    ...state,
    ...actions,
    ...derived,
    ...helpers,

    registryOne: registry,
    setRegistryOne: setRegistry,

    initialForPatch,

    state,
    actions,
    derived,
    helpers,
  } as const;
}
