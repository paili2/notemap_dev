"use client";

import { useEffect, useMemo, useState } from "react";

import { AreaSet } from "../../sections/AreaSetsSection/types";
import { parsePreset } from "@/features/properties/lib/structure";
import {
  type Registry,
  type UnitLine,
  type Grade,
  type OrientationValue,
  type AspectRowLite,
} from "@/features/properties/types/property-domain";
import { useCreateValidation } from "../hooks/useCreateValidation";
import { PinKind } from "@/features/pins/types";

type UseCreateFormArgs = {
  initialAddress?: string;
};

export function useCreateForm({ initialAddress }: UseCreateFormArgs) {
  // 헤더
  const [title, setTitle] = useState("");
  const [listingStars, setListingStars] = useState(0);
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [pinKind, setPinKind] = useState<PinKind>("1room");

  // 기본 정보
  const [address, setAddress] = useState("");
  useEffect(() => {
    setAddress(initialAddress ?? "");
  }, [initialAddress]);

  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [floor, setFloor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [structure, setStructure] = useState("3룸");

  // 숫자
  const [totalBuildings, setTotalBuildings] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [totalHouseholds, setTotalHouseholds] = useState("");
  const [remainingHouseholds, setRemainingHouseholds] = useState("");

  // 주차
  const [parkingType, setParkingType] = useState("");
  const [parkingCount, setParkingCount] = useState("");

  // 준공/매매/등기 등급
  const [completionDate, setCompletionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [registryOne, setRegistryOne] = useState<Registry | undefined>();
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

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

  // 구조 라인
  const [unitLines, setUnitLines] = useState<UnitLine[]>([]);
  const onAddPreset = (preset: string) => {
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
  const onAddEmpty = () =>
    setUnitLines((prev) => [
      ...prev,
      {
        rooms: 0,
        baths: 0,
        duplex: false,
        terrace: false,
        primary: "",
        secondary: "",
      },
    ]);
  const onUpdate = (idx: number, patch: Partial<UnitLine>) =>
    setUnitLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  const onRemove = (idx: number) =>
    setUnitLines((prev) => prev.filter((_, i) => i !== idx));

  // 옵션/메모
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");

  // 유효성
  const { isSaveEnabled } = useCreateValidation({
    title,
    address,
    officePhone,
    parkingType,
    completionDate,
    salePrice,
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,
    options,
    etcChecked,
    optionEtc,
    unitLinesLen: unitLines.length,
    listingStars,
    aspects,
    baseAreaSet,
    extraAreaSets,
  });

  // Edit과 동일하게 한 객체로 묶어서 반환
  const f = useMemo(
    () => ({
      // 헤더
      title,
      setTitle,
      listingStars,
      setListingStars,
      elevator,
      setElevator,
      pinKind,
      setPinKind,

      // 기본 정보
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

      // 숫자
      totalBuildings,
      setTotalBuildings,
      totalFloors,
      setTotalFloors,
      totalHouseholds,
      setTotalHouseholds,
      remainingHouseholds,
      setRemainingHouseholds,

      // 주차
      parkingType,
      setParkingType,
      parkingCount,
      setParkingCount,

      // 준공/매매/등급
      completionDate,
      setCompletionDate,
      salePrice,
      setSalePrice,
      registryOne,
      setRegistryOne,
      slopeGrade,
      setSlopeGrade,
      structureGrade,
      setStructureGrade,

      // 향
      aspects,
      addAspect,
      removeAspect,
      setAspectDir,

      // 면적
      baseAreaSet,
      setBaseAreaSet,
      extraAreaSets,
      setExtraAreaSets,

      // 구조 라인
      unitLines,
      onAddPreset,
      onAddEmpty,
      onUpdate,
      onRemove,

      // 옵션/메모
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

      // 유효성
      isSaveEnabled,
    }),
    [
      title,
      listingStars,
      elevator,
      pinKind,
      address,
      officePhone,
      officePhone2,
      officeName,
      moveIn,
      floor,
      roomNo,
      structure,
      totalBuildings,
      totalFloors,
      totalHouseholds,
      remainingHouseholds,
      parkingType,
      parkingCount,
      completionDate,
      salePrice,
      registryOne,
      slopeGrade,
      structureGrade,
      aspects,
      baseAreaSet,
      extraAreaSets,
      unitLines,
      options,
      etcChecked,
      optionEtc,
      publicMemo,
      secretMemo,
      isSaveEnabled,
    ]
  );

  return f;
}
