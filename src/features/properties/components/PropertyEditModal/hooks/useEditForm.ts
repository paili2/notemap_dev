"use client";

import { useEffect, useMemo, useState } from "react";
import { parsePreset, toPy } from "@/features/properties/lib/area";
import { buildOrientationFields } from "@/features/properties/lib/orientation";
import { filled, hasPair, setPack } from "@/features/properties/lib/validators";
import { PinKind } from "@/features/map/pins";
import type { AreaSet } from "../../sections/AreaSetsSection/types";
import type {
  AspectRowLite,
  Grade,
  OrientationValue,
  Registry,
  UnitLine,
} from "@/features/properties/types/property-domain";

const asStr = (v: unknown) => (v == null ? "" : String(v));
const asYMD = (v: unknown) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = asStr(v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
};
const asNum = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const unpackRange = (s: unknown): { min: string; max: string } => {
  const raw = asStr(s).trim();
  if (!raw) return { min: "", max: "" };
  const [min, max] = raw.split("~", 2);
  return { min: (min ?? "").trim(), max: (max ?? "").trim() };
};
const pickOrientation = (o: unknown): string =>
  (o as any)?.dir ?? (o as any)?.direction ?? (o as any)?.value ?? "";

type UseEditFormArgs = {
  initialData: any | null;
};

export function useEditForm({ initialData }: UseEditFormArgs) {
  // ── 기본
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

  // 향
  const [aspects, setAspects] = useState<AspectRowLite[]>([{ no: 1, dir: "" }]);
  const addAspect = () =>
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  const removeAspect = (no: number) =>
    setAspects((prev) =>
      prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
    );
  const setAspectDir = (no: number, dir: OrientationValue | "") =>
    setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));

  // 평점/주차/준공/매매가
  const [listingStars, setListingStars] = useState(0);
  const [parkingType, setParkingType] = useState("");
  const [parkingCount, setParkingCount] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");

  // 면적
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

  // 등기/등급
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [registryOne, setRegistryOne] = useState<Registry | undefined>();
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

  // 숫자
  const [totalBuildings, setTotalBuildings] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [totalHouseholds, setTotalHouseholds] = useState("");
  const [remainingHouseholds, setRemainingHouseholds] = useState("");

  // 옵션/메모
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");

  // 구조 라인
  const [unitLines, setUnitLines] = useState<UnitLine[]>([]);
  const addLineFromPreset = (preset: string) => {
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
  };
  const addEmptyLine = () =>
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
  const updateLine = (idx: number, patch: Partial<UnitLine>) =>
    setUnitLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  const removeLine = (idx: number) =>
    setUnitLines((prev) => prev.filter((_, i) => i !== idx));

  // ── 초기값 주입
  useEffect(() => {
    if (!initialData) return;

    // 기본 필드
    setTitle(initialData.title ?? "");
    setAddress(initialData.address ?? "");
    setOfficePhone(initialData.officePhone ?? "");
    setOfficePhone2(initialData.officePhone2 ?? "");
    setMoveIn(initialData.moveIn ?? "");
    setFloor(initialData.floor ?? "");
    setRoomNo(initialData.roomNo ?? "");
    setStructure(initialData.structure ?? "3룸");

    setListingStars(asNum(initialData.listingStars, 0));
    setParkingType(asStr(initialData.parkingType));
    setParkingCount(asStr(initialData.parkingCount));
    setCompletionDate(asYMD(initialData.completionDate));
    setSalePrice(asStr(initialData.salePrice));

    // 면적
    const ex = unpackRange(initialData.exclusiveArea);
    const re = unpackRange(initialData.realArea);
    const baseAreaTitle =
      asStr((initialData as any).baseAreaTitle) ||
      asStr((initialData as any).areaTitle) ||
      asStr((initialData as any).areaSetTitle) ||
      "";

    setBaseAreaSet({
      title: baseAreaTitle,
      exMinM2: ex.min,
      exMaxM2: ex.max,
      exMinPy: toPy(ex.min),
      exMaxPy: toPy(ex.max),
      realMinM2: re.min,
      realMaxM2: re.max,
      realMinPy: toPy(re.min),
      realMaxPy: toPy(re.max),
    });

    const exArr = Array.isArray((initialData as any).extraExclusiveAreas)
      ? (initialData as any).extraExclusiveAreas
      : [];
    const reArr = Array.isArray((initialData as any).extraRealAreas)
      ? (initialData as any).extraRealAreas
      : [];
    const titlesArr: string[] =
      (Array.isArray((initialData as any).extraAreaTitles) &&
        (initialData as any).extraAreaTitles.map(asStr)) ||
      (Array.isArray((initialData as any).areaSetTitles) &&
        (initialData as any).areaSetTitles.map(asStr)) ||
      [];
    const len = Math.max(exArr.length, reArr.length, titlesArr.length);

    setExtraAreaSets(
      Array.from({ length: len }, (_: unknown, i: number) => {
        const exi = unpackRange(exArr[i] ?? "");
        const rei = unpackRange(reArr[i] ?? "");
        const title = asStr(titlesArr[i]) || `세트 ${i + 1}`;
        return {
          title,
          exMinM2: exi.min,
          exMaxM2: exi.max,
          exMinPy: toPy(exi.min),
          exMaxPy: toPy(exi.max),
          realMinM2: rei.min,
          realMaxM2: rei.max,
          realMinPy: toPy(rei.min),
          realMaxPy: toPy(rei.max),
        };
      })
    );

    // 등기/등급
    setElevator((initialData.elevator as "O" | "X") ?? "O");
    setRegistryOne(initialData.registry);
    setSlopeGrade(initialData.slopeGrade as Grade | undefined);
    setStructureGrade(initialData.structureGrade as Grade | undefined);

    // 숫자
    setTotalBuildings(asStr(initialData.totalBuildings));
    setTotalFloors(asStr(initialData.totalFloors));
    setTotalHouseholds(asStr(initialData.totalHouseholds));
    setRemainingHouseholds(asStr(initialData.remainingHouseholds));

    // 옵션/메모
    setOptions(initialData.options ?? []);
    setOptionEtc(initialData.optionEtc ?? "");
    setEtcChecked(
      !!(initialData.optionEtc && initialData.optionEtc.length > 0)
    );
    setPublicMemo(initialData.publicMemo ?? "");
    setSecretMemo(initialData.secretMemo ?? "");

    // 구조 라인
    setUnitLines(initialData.unitLines ?? []);

    // 향
    if (
      Array.isArray(initialData.orientations) &&
      initialData.orientations.length > 0
    ) {
      setAspects(
        (initialData.orientations as unknown[]).map(
          (o: unknown, idx: number) => ({
            no: idx + 1,
            dir: (pickOrientation(o) as OrientationValue) || "",
          })
        )
      );
    } else {
      const dirs = [
        initialData.aspect1,
        initialData.aspect2,
        initialData.aspect3,
      ].filter((v): v is string => !!v);
      if (dirs.length > 0) {
        setAspects(
          dirs.map((d, i: number) => ({
            no: i + 1,
            dir: d as OrientationValue,
          }))
        );
      }
    }

    // 핀 종류
    setPinKind(
      ((initialData as any).pinKind ??
        (initialData as any).kind ??
        (initialData as any).markerKind ??
        "1room") as PinKind
    );
  }, [initialData]);

  // ── 유효성
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

  // ── orientation & area pack (저장에서 사용)
  const buildOrientation = () => buildOrientationFields(aspects);
  const packAreas = () => {
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
  };

  return {
    // 상태 + setter
    pinKind,
    setPinKind,
    title,
    setTitle,
    address,
    setAddress,
    officePhone,
    setOfficePhone,
    officePhone2,
    setOfficePhone2,
    officeName,
    setOfficeName,
    moveIn,
    setMoveIn,
    floor,
    setFloor,
    roomNo,
    setRoomNo,
    structure,
    setStructure,

    aspects,
    addAspect,
    removeAspect,
    setAspectDir,

    listingStars,
    setListingStars,
    parkingType,
    setParkingType,
    parkingCount,
    setParkingCount,
    completionDate,
    setCompletionDate,
    salePrice,
    setSalePrice,

    baseAreaSet,
    setBaseAreaSet,
    extraAreaSets,
    setExtraAreaSets,

    elevator,
    setElevator,
    registryOne,
    setRegistryOne,
    slopeGrade,
    setSlopeGrade,
    structureGrade,
    setStructureGrade,

    totalBuildings,
    setTotalBuildings,
    totalFloors,
    setTotalFloors,
    totalHouseholds,
    setTotalHouseholds,
    remainingHouseholds,
    setRemainingHouseholds,

    options,
    setOptions,
    etcChecked,
    setEtcChecked,
    optionEtc,
    setOptionEtc,

    publicMemo,
    setPublicMemo,
    secretMemo,
    setSecretMemo,

    unitLines,
    setUnitLines,
    addLineFromPreset,
    addEmptyLine,
    updateLine,
    removeLine,

    // 파생
    isSaveEnabled,

    // 저장용 헬퍼
    buildOrientation,
    packAreas,
  };
}

export type EditFormAPI = ReturnType<typeof useEditForm>;
