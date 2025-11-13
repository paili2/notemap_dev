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
  UnitLine,
  PinKind,
} from "./types";
import { BuildingType } from "@/features/properties/types/property-domain";

type StarStr = "" | "1" | "2" | "3" | "4" | "5";
type RegistryUi = "주택" | "APT" | "OP" | "도/생" | "근/생" | undefined;
type BuildingGrade = "" | "new" | "old";

type InitialForPatch = {
  contactMainPhone: string;
  contactSubPhone: string;
  minRealMoveInCost: string;
  unitLines: UnitLine[];
};

/** 서버 buildingType → UI 등기 표기 보정 (도/생 포함) */
const toUIRegistryFromBuildingType = (v: any): RegistryUi => {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (!s) return undefined;
  if (["apt", "아파트"].includes(s)) return "APT";
  if (["op", "officetel", "오피스텔"].includes(s)) return "OP";
  if (["주택", "house", "housing", "residential"].includes(s)) return "주택";
  if (
    ["도/생", "도생", "도시생활형", "도시생활형주택", "urban", "urb"].includes(
      s
    )
  )
    return "도/생";
  if (["근생", "근/생", "근린생활시설", "nearlife", "commercial"].includes(s))
    return "근/생";
  return undefined;
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

  // ⭐ 사용자 향 편집 여부 (추가)
  const aspectsTouchedRef = useRef(false);
  const [aspectsTouched, setAspectsTouched] = useState(false);
  const markAspectsTouched = () => {
    if (!aspectsTouchedRef.current) {
      aspectsTouchedRef.current = true;
      setAspectsTouched(true);
    }
  };

  // ⭐ 매물평점(별 1~5, 공백 허용)
  const [parkingGrade, setParkingGrade] = useState<StarStr>("");
  const [parkingTypeId, setParkingTypeId] = useState<number | null>(null);
  const [parkingType, setParkingType] = useState("");
  const [totalParkingSlots, setTotalParkingSlots] = useState<string>("");
  const [completionDate, setCompletionDate] = useState("");

  const [salePriceRaw, setSalePriceRaw] = useState<string | number | null>("");

  const setSalePrice = useCallback(
    (v: string | number | null) => setSalePriceRaw(v),
    []
  );

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

  const [unitLines, setUnitLines] = useState<UnitLine[]>([]);
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);

  /* ========== 액션 ========== */
  const addAspect = useCallback(() => {
    markAspectsTouched();
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  }, []);
  const removeAspect = useCallback((no: number) => {
    markAspectsTouched();
    setAspects((prev) =>
      prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
    );
  }, []);
  const setAspectDir = useCallback((no: number, dir: OrientationValue | "") => {
    markAspectsTouched();
    setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));
  }, []);

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
    aspectsTouchedRef.current = false;
    setAspectsTouched(false);

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
    setParkingType("");
    setParkingTypeId(null);
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
  }, []);

  /* ========== 초기 주입 (생략 없는 원본 그대로) ========== */
  const wrapper = initialData as any;
  const sourceData =
    (wrapper?.raw as any) ?? (wrapper?.view as any) ?? initialData ?? null;

  const initId: string | number | null =
    (wrapper?.id as any) ??
    (wrapper?.raw?.id as any) ??
    (wrapper?.view?.id as any) ??
    (wrapper?.raw?.propertyId as any) ??
    (wrapper?.view?.propertyId as any) ??
    (sourceData?.id as any) ??
    (sourceData?.propertyId as any) ??
    null;

  const initKey: string | number | null =
    initId ?? (sourceData ? "__NOID__" : null);

  const normalized = useMemo(() => normalizeInitialData(sourceData), [initKey]);
  const injectedOnceRef = useRef<null | string | number>(null);

  const initialForPatchRef = useRef<InitialForPatch>({
    contactMainPhone: "",
    contactSubPhone: "",
    minRealMoveInCost: "",
    unitLines: [],
  });

  useEffect(() => {
    injectedOnceRef.current = null;
  }, [initKey]);

  useEffect(() => {
    if (initKey == null) return;
    if (injectedOnceRef.current === initKey) return;
    injectedOnceRef.current = initKey;

    aspectsTouchedRef.current = false;
    setAspectsTouched(false);

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

    const pg = (normalized as any)?.parkingGrade as StarStr | undefined;
    setParkingGrade(pg && ["1", "2", "3", "4", "5"].includes(pg) ? pg : "");

    setParkingType(normalized.parkingType ?? "");
    setParkingTypeId((normalized as any)?.parkingTypeId ?? null);
    setTotalParkingSlots(
      (normalized as any).totalParkingSlots != null
        ? String((normalized as any).totalParkingSlots)
        : ""
    );
    setCompletionDate(normalized.completionDate);
    setSalePrice(normalized.salePrice);

    setBaseAreaSet(normalized.baseArea);
    setExtraAreaSets(normalized.extraAreas);

    setElevator(normalized.elevator);

    const normGrade =
      (normalized as any)?.building?.grade ??
      (normalized as any)?.buildingGrade ??
      "";
    setBuildingGrade(
      normGrade === "new" || normGrade === "old" ? normGrade : ""
    );

    const normRegRaw =
      (normalized as any).registry ??
      (normalized as any).registryOne ??
      undefined;
    const regFromBT = toUIRegistryFromBuildingType(
      (normalized as any).buildingType
    );
    const finalRegistry =
      (normRegRaw && String(normRegRaw).trim() !== ""
        ? (normRegRaw as RegistryUi)
        : undefined) ?? regFromBT;
    setRegistry(finalRegistry);

    setSlopeGrade(normalized.slopeGrade);
    setStructureGrade(normalized.structureGrade);

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

    initialForPatchRef.current = {
      contactMainPhone: normalized.officePhone ?? "",
      contactSubPhone: normalized.officePhone2 ?? "",
      minRealMoveInCost: normalized.salePrice ?? "",
      unitLines: (normalized.unitLines ?? []).map((u) => ({ ...u })),
    };
  }, [initKey, normalized]);

  useEffect(() => {
    const normRegRaw =
      (normalized as any)?.registry ??
      (normalized as any)?.registryOne ??
      undefined;
    const regFromBT = toUIRegistryFromBuildingType(
      (normalized as any)?.buildingType
    );

    const calculated =
      (normRegRaw && String(normRegRaw).trim() !== ""
        ? (normRegRaw as RegistryUi)
        : undefined) ?? regFromBT;

    setRegistry((prev) => {
      if (prev && calculated && String(prev) === String(calculated))
        return prev;
      return calculated;
    });
  }, [
    (normalized as any)?.registry,
    (normalized as any)?.registryOne,
    (normalized as any)?.buildingType,
  ]);

  /* ========== 파생값/유효성 ========== */
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

  const isSaveEnabled = useMemo<boolean>(() => {
    const numbersOk =
      filled(totalBuildings) &&
      filled(totalFloors) &&
      filled(totalHouseholds) &&
      filled(remainingHouseholds);

    const salePriceOk = filled(String(salePriceRaw ?? ""));

    const basicOk =
      filled(title) &&
      filled(address) &&
      filled(officePhone) &&
      filled(parkingType) &&
      filled(completionDate) &&
      salePriceOk &&
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
    salePriceRaw,
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
      parkingTypeId,
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
      // 추가
      aspectsTouched,
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
      parkingTypeId,
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
      setParkingTypeId,
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

    initialForPatch: initialForPatchRef.current,

    state,
    actions,
    derived,
    helpers,
  } as const;
}
