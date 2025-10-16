"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parsePreset } from "@/features/properties/lib/area";
import { buildOrientationFields } from "@/features/properties/lib/orientation";
import { filled, hasPair, setPack } from "@/features/properties/lib/validators";

import { EMPTY_ASPECTS } from "./constants";
import { normalizeInitialData } from "./normalize";
import type {
  AreaSet,
  AspectRowLite,
  UseEditFormArgs,
  Grade,
  OrientationValue,
  Registry,
  UnitLine,
  PinKind,
} from "./types";

export function useEditForm({ initialData }: UseEditFormArgs) {
  /* ========== 상태 ========== */
  const [pinKind, setPinKind] = useState<PinKind>("1room");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [floor, setFloor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [structure, setStructure] = useState("3룸");

  const [aspects, setAspects] = useState<AspectRowLite[]>(EMPTY_ASPECTS);

  const [listingStars, setListingStars] = useState(0);
  const [parkingType, setParkingType] = useState("");
  const [parkingCount, setParkingCount] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const [baseAreaSet, setBaseAreaSet] = useState<AreaSet>({
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
  const [extraAreaSets, setExtraAreaSets] = useState<AreaSet[]>([]);

  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [registryOne, setRegistryOne] = useState<Registry | undefined>();
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

  const [unitLines, setUnitLines] = useState<UnitLine[]>([]);

  /* ========== 액션 ========== */
  const addAspect = useCallback(
    () => setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]),
    []
  );
  const removeAspect = useCallback((no: number) => {
    setAspects((prev) =>
      prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
    );
  }, []);
  const setAspectDir = useCallback(
    (no: number, dir: OrientationValue | "") =>
      setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r))),
    []
  );

  const addLineFromPreset = useCallback((preset: string) => {
    const { rooms, baths } = parsePreset(preset);
    setUnitLines((prev) => [
      ...prev,
      {
        rooms,
        baths,
        duplex: false,
        terrace: false,
        primary: "",
        secondary: "",
      },
    ]);
  }, []);
  const addEmptyLine = useCallback(() => {
    setUnitLines((prev) => [
      {
        rooms: 0,
        baths: 0,
        duplex: false,
        terrace: false,
        primary: "",
        secondary: "",
      },
      ...prev,
    ]);
  }, []);
  const updateLine = useCallback((idx: number, patch: Partial<UnitLine>) => {
    setUnitLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  }, []);
  const removeLine = useCallback((idx: number) => {
    setUnitLines((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const reset = useCallback(() => {
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
    setListingStars(0);
    setParkingType("");
    setParkingCount("");
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
    setRegistryOne(undefined);
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
  }, []);

  /* ========== 초기 주입 ========== */
  const normalized = useMemo(
    () => normalizeInitialData(initialData),
    [initialData]
  );

  const injectedOnceRef = useRef(false);
  useEffect(() => {
    if (!initialData) return;
    injectedOnceRef.current = true;

    setPinKind(normalized.pinKind);
    setTitle(normalized.title);
    setAddress(normalized.address);
    setOfficePhone(normalized.officePhone);
    setOfficePhone2(normalized.officePhone2);
    setOfficeName(normalized.officeName);
    setMoveIn(normalized.moveIn);
    setFloor(normalized.floor);
    setRoomNo(normalized.roomNo);
    setStructure(normalized.structure);

    setListingStars(normalized.listingStars);
    setParkingType(normalized.parkingType);
    setParkingCount(normalized.parkingCount);
    setCompletionDate(normalized.completionDate);
    setSalePrice(normalized.salePrice);

    setBaseAreaSet(normalized.baseArea);
    setExtraAreaSets(normalized.extraAreas);

    setElevator(normalized.elevator);
    setRegistryOne(normalized.registryOne);
    setSlopeGrade(normalized.slopeGrade);
    setStructureGrade(normalized.structureGrade);

    setTotalBuildings(normalized.totalBuildings);
    setTotalFloors(normalized.totalFloors);
    setTotalHouseholds(normalized.totalHouseholds);
    setRemainingHouseholds(normalized.remainingHouseholds);

    setOptions(normalized.options);
    setOptionEtc(normalized.optionEtc);
    setEtcChecked(normalized.etcChecked);
    setPublicMemo(normalized.publicMemo);
    setSecretMemo(normalized.secretMemo);
    setUnitLines(normalized.unitLines);

    setAspects(normalized.aspects);
  }, [initialData, normalized]);

  /* ========== 파생값 ========== */
  const baseHasExclusive = useMemo(
    () =>
      hasPair(baseAreaSet.exMinM2, baseAreaSet.exMaxM2) ||
      hasPair(baseAreaSet.exMinPy, baseAreaSet.exMaxPy),
    [
      baseAreaSet.exMinM2,
      baseAreaSet.exMaxM2,
      baseAreaSet.exMinPy,
      baseAreaSet.exMaxPy,
    ]
  );
  const baseHasReal = useMemo(
    () =>
      hasPair(baseAreaSet.realMinM2, baseAreaSet.realMaxM2) ||
      hasPair(baseAreaSet.realMinPy, baseAreaSet.realMaxPy),
    [
      baseAreaSet.realMinM2,
      baseAreaSet.realMaxM2,
      baseAreaSet.realMinPy,
      baseAreaSet.realMaxPy,
    ]
  );
  const extrasHaveExclusive = useMemo(
    () =>
      extraAreaSets.some(
        (s) => hasPair(s.exMinM2, s.exMaxM2) || hasPair(s.exMinPy, s.exMaxPy)
      ),
    [extraAreaSets]
  );
  const extrasHaveReal = useMemo(
    () =>
      extraAreaSets.some(
        (s) =>
          hasPair(s.realMinM2, s.realMaxM2) || hasPair(s.realMinPy, s.realMaxPy)
      ),
    [extraAreaSets]
  );

  const hasExclusiveAny = baseHasExclusive || extrasHaveExclusive;
  const hasRealAny = baseHasReal || extrasHaveReal;

  const optionsValid = useMemo(
    () => options.length > 0 || (etcChecked && optionEtc.trim().length > 0),
    [options, etcChecked, optionEtc]
  );
  const aspectsValid = useMemo(
    () => aspects.length > 0 && aspects[0].dir.trim().length > 0,
    [aspects]
  );

  const isSaveEnabled = useMemo<boolean>(() => {
    const numbersOk =
      filled(totalBuildings) &&
      filled(totalFloors) &&
      filled(totalHouseholds) &&
      filled(remainingHouseholds);

    const basicOk =
      filled(title) &&
      filled(address) &&
      filled(officePhone) &&
      filled(parkingType) &&
      filled(completionDate) &&
      filled(salePrice) &&
      hasExclusiveAny &&
      hasRealAny;

    return (
      basicOk &&
      numbersOk &&
      optionsValid &&
      unitLines.length > 0 &&
      listingStars > 0 &&
      aspectsValid
    );
  }, [
    title,
    address,
    officePhone,
    parkingType,
    completionDate,
    salePrice,
    hasExclusiveAny,
    hasRealAny,
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,
    optionsValid,
    unitLines.length,
    listingStars,
    aspectsValid,
  ]);

  /* ========== 저장 헬퍼 ========== */
  const buildOrientation = useCallback(
    () => buildOrientationFields(aspects),
    [aspects]
  );

  const packAreas = useCallback(() => {
    const exclusiveArea = setPack(
      baseAreaSet.exMinM2,
      baseAreaSet.exMaxM2,
      baseAreaSet.exMinPy,
      baseAreaSet.exMaxPy
    );
    const realArea = setPack(
      baseAreaSet.realMinM2,
      baseAreaSet.realMaxM2,
      baseAreaSet.realMinPy,
      baseAreaSet.realMaxPy
    );
    const extraExclusiveAreas = extraAreaSets.map((s) =>
      setPack(s.exMinM2, s.exMaxM2, s.exMinPy, s.exMaxPy)
    );
    const extraRealAreas = extraAreaSets.map((s) =>
      setPack(s.realMinM2, s.realMaxM2, s.realMinPy, s.realMaxPy)
    );
    const baseAreaTitleOut = baseAreaSet.title?.trim() ?? "";
    const extraAreaTitlesOut = extraAreaSets.map((s) => (s.title ?? "").trim());
    return {
      exclusiveArea,
      realArea,
      extraExclusiveAreas,
      extraRealAreas,
      baseAreaTitleOut,
      extraAreaTitlesOut,
    };
  }, [baseAreaSet, extraAreaSets]);

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
      listingStars,
      parkingType,
      parkingCount,
      completionDate,
      salePrice,
      baseAreaSet,
      extraAreaSets,
      elevator,
      registryOne,
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
      listingStars,
      parkingType,
      parkingCount,
      completionDate,
      salePrice,
      baseAreaSet,
      extraAreaSets,
      elevator,
      registryOne,
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
      setListingStars,
      setParkingType,
      setParkingCount,
      setCompletionDate,
      setSalePrice,
      setBaseAreaSet,
      setExtraAreaSets,
      setElevator,
      setRegistryOne,
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
    ]
  );

  const derived = useMemo(() => ({ isSaveEnabled }), [isSaveEnabled]);
  const helpers = useMemo(
    () => ({ buildOrientation, packAreas }),
    [buildOrientation, packAreas]
  );

  return { state, actions, derived, helpers };
}
