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

/** 서버 buildingType → UI 용도 표기 (도/생/근생 라벨) */
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

  // ⭐ 사용자 향 편집 여부
  const aspectsTouchedRef = useRef(false);
  const [aspectsTouched, setAspectsTouched] = useState(false);
  const markAspectsTouched = () => {
    if (!aspectsTouchedRef.current) {
      aspectsTouchedRef.current = true;
      setAspectsTouched(true);
    }
  };

  // ⭐ 면적 세트(base/extra) 편집 여부
  const [areaSetsTouched, setAreaSetsTouched] = useState(false);

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

  const [baseAreaSet, _setBaseAreaSet] = useState<AreaSet>({
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
  const [extraAreaSets, _setExtraAreaSets] = useState<AreaSet[]>([]);

  // 면적 세트 변경 시 터치 플래그 올리는 setter 래퍼
  const setBaseAreaSet = useCallback(
    (v: AreaSet | ((prev: AreaSet) => AreaSet)) => {
      setAreaSetsTouched(true);
      _setBaseAreaSet(v as any);
    },
    []
  );

  const setExtraAreaSets = useCallback(
    (v: AreaSet[] | ((prev: AreaSet[]) => AreaSet[])) => {
      setAreaSetsTouched(true);
      _setExtraAreaSets(v as any);
    },
    []
  );

  /** ✅ 엘리베이터: "O" | "X" (기본값 "O") */
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

  /** ✅ 서버 enum 그대로 또는 null */
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
  }, []);

  /* ========== 초기 주입 ========== */
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

  const normalized = useMemo(() => {
    // 🔍 2차: sourceData → normalized 흐름 확인용
    console.log("[useEditForm] sourceData(flattened) =", sourceData);

    const n = normalizeInitialData(sourceData);

    console.log("[useEditForm] normalized =", n);

    return n;
  }, [initKey, sourceData]);

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
    setAreaSetsTouched(false);

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

    setParkingType(
      (normalized as any).parkingType != null
        ? (normalized as any).parkingType
        : null
    );

    setTotalParkingSlots(
      (normalized as any).totalParkingSlots != null
        ? String((normalized as any).totalParkingSlots)
        : ""
    );
    setCompletionDate(normalized.completionDate);
    setSalePrice(normalized.salePrice);

    // 🔥 서버에서 온 리베이트 값들을 최대한 안전하게 텍스트로 주입
    const rebateFromNormalized =
      (normalized as any).rebateText ??
      (normalized as any).rebateMemo ??
      (normalized as any).rebate ??
      undefined;

    const rebateFromSource =
      (sourceData as any)?.rebateText ??
      (sourceData as any)?.rebate ??
      (sourceData as any)?.rebateMemo ??
      undefined;

    setRebateText(
      rebateFromNormalized != null && rebateFromNormalized !== ""
        ? String(rebateFromNormalized)
        : rebateFromSource != null && rebateFromSource !== ""
        ? String(rebateFromSource)
        : ""
    );

    setBaseAreaSet(normalized.baseArea);
    setExtraAreaSets(normalized.extraAreas);

    /** 🔵 엘리베이터: 서버 값 → "O" | "X" 로 안전 정규화 */
    {
      const raw =
        (normalized as any).elevator ?? (normalized as any).hasElevator;
      let next: "O" | "X" = "O";
      if (raw === "O" || raw === "X") {
        next = raw;
      } else if (raw === true) {
        next = "O";
      } else if (raw === false) {
        next = "X";
      }
      setElevator(next);
    }

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
      (sourceData as any)?.registry ??
      undefined;
    const regFromBT = toUIRegistryFromBuildingType(
      (normalized as any).buildingType ??
        (sourceData as any)?.buildingType ??
        undefined
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

    // ✅ 옵션/직접입력도 서버 값 주입 (+ extraOptionsText 브릿지)
    const normalizedOptions: any = (normalized as any).options;

    // 1) 프리셋 옵션 배열 만들기
    const presetOptions: string[] = Array.isArray(normalizedOptions)
      ? normalizedOptions
      : Array.isArray(normalizedOptions?.presetOptions)
      ? normalizedOptions.presetOptions
      : [];

    // 2) extra 옵션 텍스트 후보들을 한 번에 모아서 merge (중복 제거)
    const extraCandidatesRaw: unknown[] = [
      (normalized as any).optionEtc,
      (normalized as any).extraOptionsText,
      normalizedOptions?.extraOptionsText,
      (sourceData as any)?.optionEtc,
      (sourceData as any)?.extraOptionsText,
      (sourceData as any)?.options?.extraOptionsText,
    ];

    // 공백 제거 + 빈 문자열 제거 + 중복 제거
    const extraCandidates = Array.from(
      new Set(
        extraCandidatesRaw
          .map((v) => (v == null ? "" : String(v).trim()))
          .filter((v) => v.length > 0)
      )
    );

    const mergedOptionEtc = extraCandidates.join(", ");

    // 디버그 필요 없으면 아래 로그는 나중에 지워도 됨
    console.log("[useEditForm][options init]", {
      presetOptions,
      extraCandidates,
      mergedOptionEtc,
    });

    // 3) 최종 상태에 주입
    setOptions(presetOptions);
    setOptionEtc(mergedOptionEtc);

    // ✅ 체크 여부는 서버 etcChecked OR 텍스트 유무 기준으로
    setEtcChecked(
      Boolean(
        (normalized as any).etcChecked ||
          (mergedOptionEtc && mergedOptionEtc.trim().length > 0)
      )
    );

    // ✅ 메모 / 유닛 라인
    setPublicMemo(normalized.publicMemo);
    setSecretMemo(normalized.secretMemo);
    setUnitLines(normalized.unitLines);

    setAspects(normalized.aspects);

    /** ✅ 백엔드 buildingType 그대로 상태에 주입 */
    setBuildingType(
      (normalized as any).buildingType ??
        (sourceData as any)?.buildingType ??
        null
    );

    initialForPatchRef.current = {
      contactMainPhone: normalized.officePhone ?? "",
      contactSubPhone: normalized.officePhone2 ?? "",
      minRealMoveInCost: normalized.salePrice ?? "",
      unitLines: (normalized.unitLines ?? []).map((u) => ({ ...u })),
    };
  }, [initKey, normalized, sourceData]);

  useEffect(() => {
    const normRegRaw =
      (normalized as any)?.registry ??
      (normalized as any)?.registryOne ??
      (sourceData as any)?.registry ??
      undefined;
    const regFromBT = toUIRegistryFromBuildingType(
      (normalized as any)?.buildingType ??
        (sourceData as any)?.buildingType ??
        undefined
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
    sourceData,
  ]);

  // 🔎 디버그용: buildingType/parkingType 변화 로그
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[useEditForm] buildingType =", buildingType);
  }, [buildingType]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[useEditForm] parkingType =", parkingType);
  }, [parkingType]);

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
    // ✅ 수정 모달은 "부분 수정" 허용: 최소 조건만 체크
    const hasTitle = filled(title);
    const hasMainPhone = filled(officePhone);

    return hasTitle && hasMainPhone;
  }, [title, officePhone]);

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
