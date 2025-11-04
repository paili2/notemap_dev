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
import { BuildingType } from "@/features/properties/types/property-domain";

type StarStr = "" | "1" | "2" | "3" | "4" | "5";

/** 변경분만 PATCH하기 위한 최초 스냅샷 타입 */
type InitialForPatch = {
  contactMainPhone: string; // 분양사무실 전화
  contactSubPhone: string; // 분양사무실 보조 전화
  minRealMoveInCost: string; // 최저 실입(현재 폼의 salePrice 문자열과 매핑)
  unitLines: UnitLine[]; // 구조별 입력
};

export function useEditForm({ initialData }: UseEditFormArgs) {
  /* ========== 상태 ========== */
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

  const [aspects, setAspects] = useState<AspectRowLite[]>(EMPTY_ASPECTS);

  // ⭐ 매물평점(별 1~5) – 문자열 보관
  const [parkingGrade, setParkingGrade] = useState<StarStr>("");

  const [parkingType, setParkingType] = useState("");
  const [totalParkingSlots, setTotalParkingSlots] = useState<string>("");
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
  const [registry, setRegistry] = useState<Registry | undefined>();
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

  // ✅ 신규 숫자 필드들(문자 입력 허용)
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
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);

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
    setParkingGrade(""); // ⭐
    setParkingType("");
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
  }, []);

  /* ========== 초기 주입: id 기준 1회 ========== */
  const initId = initialData?.id ?? null;

  // id가 바뀔 때만 normalize
  const normalized = useMemo(() => normalizeInitialData(initialData), [initId]);

  const injectedOnceRef = useRef<null | string | number>(null);

  // ✅ 최초 스냅샷 보관 (변경분만 PATCH 용)
  const initialForPatchRef = useRef<InitialForPatch>({
    contactMainPhone: "",
    contactSubPhone: "",
    minRealMoveInCost: "",
    unitLines: [],
  });

  // id가 바뀔 때만 재주입 허용
  useEffect(() => {
    injectedOnceRef.current = null;
  }, [initId]);

  useEffect(() => {
    if (!initId) return; // id 없으면 주입 보류
    if (injectedOnceRef.current === initId) return;
    injectedOnceRef.current = initId;

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

    // ⭐ parkingGrade만 주입 (레거시 listingStars는 사용하지 않음)
    const pg = (normalized as any)?.parkingGrade as StarStr | undefined;
    setParkingGrade(pg && ["1", "2", "3", "4", "5"].includes(pg) ? pg : "");

    setParkingType(normalized.parkingType ?? "");
    setTotalParkingSlots((normalized as any).totalParkingSlots ?? "");
    setCompletionDate(normalized.completionDate);
    setSalePrice(normalized.salePrice);

    setBaseAreaSet(normalized.baseArea);
    setExtraAreaSets(normalized.extraAreas);

    setElevator(normalized.elevator);
    setRegistry(
      (normalized as any).registry ?? (normalized as any).registryOne
    );
    setSlopeGrade(normalized.slopeGrade);
    setStructureGrade(normalized.structureGrade);

    // ✅ 신규 숫자 필드 초기 주입(문자 형태 유지)
    setTotalBuildings((normalized.totalBuildings ?? "") as unknown as string);
    setTotalFloors((normalized.totalFloors ?? "") as unknown as string);
    setTotalHouseholds((normalized.totalHouseholds ?? "") as unknown as string);
    setRemainingHouseholds(
      (normalized.remainingHouseholds ?? "") as unknown as string
    );

    setOptions(normalized.options);
    setOptionEtc(normalized.optionEtc);
    setEtcChecked(normalized.etcChecked);
    setPublicMemo(normalized.publicMemo);
    setSecretMemo(normalized.secretMemo);
    setUnitLines(normalized.unitLines);

    setAspects(normalized.aspects);
    setBuildingType((normalized as any).buildingType ?? null);

    // ✅ 최초 스냅샷 저장
    initialForPatchRef.current = {
      contactMainPhone: normalized.officePhone ?? "",
      contactSubPhone: normalized.officePhone2 ?? "",
      // 현재 폼에서 '최저실입' = salePrice 로 사용 중
      minRealMoveInCost: normalized.salePrice ?? "",
      unitLines: (normalized.unitLines ?? []).map((u) => ({ ...u })),
    };
  }, [initId, normalized]); // ← normalized은 initId에만 의존하므로 안전

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
    () =>
      aspects.filter(
        (a) => typeof a.dir === "string" && a.dir.trim().length > 0
      ).length > 0,
    [aspects]
  );

  // ✅ 저장 가능 여부
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

    const gradeOk = parkingGrade !== "";

    return (
      basicOk &&
      numbersOk &&
      optionsValid &&
      unitLines.length > 0 &&
      gradeOk &&
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
    parkingGrade,
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
      parkingGrade, // ⭐
      parkingType,
      totalParkingSlots,
      completionDate,
      salePrice,
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
      salePrice,
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
      setParkingGrade, // ⭐
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

  return {
    // flat fields (읽기용 상태)
    ...state,
    // flat actions (setter/액션)
    ...actions,
    // flat derived/헬퍼
    ...derived,
    ...helpers,

    // 레거시 호환 브릿지
    registryOne: registry,
    setRegistryOne: setRegistry,

    // 🔹 최초 스냅샷(변경분 PATCH용)
    initialForPatch: initialForPatchRef.current,

    // 구조적 접근도 가능하도록 원본 객체도 노출
    state,
    actions,
    derived,
    helpers,
  } as const;
}
