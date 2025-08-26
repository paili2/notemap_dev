"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import HeaderSection from "../../common/sections/HeaderSection";
import ImagesSection from "../../common/sections/ImagesSection";
import BasicInfoSection from "../../common/sections/BasicInfoSection";
import NumbersSection from "../../common/sections/NumbersSection";
import AspectsSection from "../../common/sections/AspectsSection";
import ParkingSection from "../../common/sections/ParkingSection";
import CompletionPriceSection from "../../common/sections/CompletionPriceSection";
import AreaSection from "../../common/sections/AreaSection";
import RegistryGradeSection from "../../common/sections/RegistryGradeSection";
import OptionsSection from "../../common/sections/OptionsSection";
import MemoSection from "../../common/sections/MemoSection";
import FooterButtons from "../../common/sections/FooterButtons";

import { buildOrientationFields } from "@/features/properties/lib/orientation";
import {
  packRange,
  parsePreset,
  toM2,
  toPy,
} from "@/features/properties/lib/area";
import { starsToGrade } from "@/features/properties/lib/grade";

import {
  type DealStatus,
  type Visibility,
  type Registry,
  type UnitLine,
  type Grade,
  type OrientationValue,
  type AspectRowLite,
  REGISTRY_LIST,
} from "@/features/properties/types/property-domain";
import type { PropertyCreateModalProps } from "./types";
import type { CreatePayload } from "@/features/properties/types/property-dto";
import StructureLinesSection from "../../common/sections/StructureLinesSection";
import { ALL_OPTIONS, STRUCTURE_PRESETS } from "../../common/constants";

/** 실제 훅/상태는 전부 여기서 "항상 같은 순서"로 호출 */
export default function PropertyCreateModalBody({
  onClose,
  onSubmit,
  initialAddress,
}: Omit<PropertyCreateModalProps, "open">) {
  /* ===================== 이미지 업로드 ===================== */
  const [images, setImages] = useState<string[]>(["", "", "", ""]);
  const fileInputs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const onPickFile = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImages((prev) => {
      const next = [...prev];
      next[idx] = url;
      return next;
    });
  };

  /* ===================== 기본 상태 ===================== */
  const [mode, setMode] = useState<"KN" | "R">("KN");
  const toggleMode = () => setMode((m) => (m === "KN" ? "R" : "KN"));

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  useEffect(() => {
    setAddress(initialAddress ?? "");
  }, [initialAddress]);

  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");
  const [officeName, setOfficeName] = useState(""); // 포함만, 아직 사용 X
  const [moveIn, setMoveIn] = useState(""); // 포함만, 아직 사용 X
  const [floor, setFloor] = useState(""); // 포함만, 아직 사용 X
  const [roomNo, setRoomNo] = useState(""); // 포함만, 아직 사용 X
  const [structure, setStructure] = useState("3룸"); // 포함만, 아직 사용 X

  /* ===================== 향 ===================== */
  const [aspects, setAspects] = useState<AspectRowLite[]>([{ no: 1, dir: "" }]);
  const addAspect = () =>
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  const removeAspect = (no: number) =>
    setAspects((prev) =>
      prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
    );
  const setAspectDir = (no: number, dir: OrientationValue | "") =>
    setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));

  /* ===================== 주차/준공/실입 ===================== */
  const [parkingType, setParkingType] = useState("");
  const [parkingStars, setParkingStars] = useState(0);
  const [completionDate, setCompletionDate] = useState("");
  const [jeonsePrice, setJeonsePrice] = useState("");

  /* ===================== 면적 ===================== */
  const [exMinM2, setExMinM2] = useState("");
  const [exMaxM2, setExMaxM2] = useState("");
  const [exMinPy, setExMinPy] = useState("");
  const [exMaxPy, setExMaxPy] = useState("");
  const [realMinM2, setRealMinM2] = useState("");
  const [realMaxM2, setRealMaxM2] = useState("");
  const [realMinPy, setRealMinPy] = useState("");
  const [realMaxPy, setRealMaxPy] = useState("");

  /* ===================== 엘리베이터/등기/등급 ===================== */
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [registryOne, setRegistryOne] = useState<Registry | undefined>(
    undefined
  );
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

  /* ===================== 숫자 선택 ===================== */
  const [totalBuildingsType, setTotalBuildingsType] = useState<
    "select" | "custom"
  >("select");
  const [totalBuildings, setTotalBuildings] = useState("");
  const [totalFloorsType, setTotalFloorsType] = useState<"select" | "custom">(
    "select"
  );
  const [totalFloors, setTotalFloors] = useState("");
  const [totalHouseholdsType, setTotalHouseholdsType] = useState<
    "select" | "custom"
  >("select");
  const [totalHouseholds, setTotalHouseholds] = useState("");
  const [remainingHouseholdsType, setRemainingHouseholdsType] = useState<
    "select" | "custom"
  >("select");
  const [remainingHouseholds, setRemainingHouseholds] = useState("");

  const numberItems = useMemo(
    () => Array.from({ length: 20 }, (_, i) => `${i + 1}`),
    []
  );

  /* ===================== 옵션 ===================== */
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");

  /* ===================== 메모 ===================== */
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");
  const memoValue = mode === "KN" ? publicMemo : secretMemo;
  const setMemoValue = (v: string) =>
    mode === "KN" ? setPublicMemo(v) : setSecretMemo(v);

  /* ===================== 헤더 상태 ===================== */
  const [visibility, setVisibility] = useState<Visibility>("공개");
  const [dealStatus, setDealStatus] = useState<DealStatus>("분양중");

  /* ===================== 구조별 입력 ===================== */
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
  const updateLine = (idx: number, patch: Partial<UnitLine>) =>
    setUnitLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  const removeLine = (idx: number) =>
    setUnitLines((prev) => prev.filter((_, i) => i !== idx));

  /* ===================== 유효성 ===================== */
  const filled = (s: string) => s.trim().length > 0;
  const hasPair = (min: string, max: string): boolean =>
    min.trim().length > 0 && max.trim().length > 0;

  const hasExclusiveAny = useMemo(
    () => hasPair(exMinM2, exMaxM2) || hasPair(exMinPy, exMaxPy),
    [exMinM2, exMaxM2, exMinPy, exMaxPy]
  );
  const hasRealAny = useMemo(
    () => hasPair(realMinM2, realMaxM2) || hasPair(realMinPy, realMaxPy),
    [realMinM2, realMaxM2, realMinPy, realMaxPy]
  );
  const optionsValid = useMemo(
    () => options.length > 0 || (etcChecked && optionEtc.trim().length > 0),
    [options, etcChecked, optionEtc]
  );

  // ✅ 에러 방지: boolean으로 확정
  const isSaveEnabled = useMemo<boolean>(() => {
    const aspectsValid = aspects.length > 0 && aspects[0].dir.trim().length > 0;
    const numbers =
      filled(totalBuildings) &&
      filled(totalFloors) &&
      filled(totalHouseholds) &&
      filled(remainingHouseholds);
    const basic =
      filled(title) &&
      filled(address) &&
      filled(officePhone) &&
      filled(parkingType) &&
      filled(completionDate) &&
      filled(jeonsePrice) &&
      hasExclusiveAny &&
      hasRealAny &&
      !!slopeGrade &&
      !!structureGrade;

    return (
      basic &&
      numbers &&
      optionsValid &&
      unitLines.length > 0 &&
      parkingStars > 0 &&
      aspectsValid
    );
  }, [
    title,
    address,
    officePhone,
    parkingType,
    completionDate,
    jeonsePrice,
    hasExclusiveAny,
    hasRealAny,
    slopeGrade,
    structureGrade,
    totalBuildings,
    totalFloors,
    totalHouseholds,
    remainingHouseholds,
    optionsValid,
    unitLines,
    parkingStars,
    aspects,
  ]);

  /* ===================== 저장 ===================== */
  const save = async () => {
    if (!title.trim()) return;

    const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
      buildOrientationFields(aspects);

    const exMinM2Final = exMinM2.trim() || toM2(exMinPy);
    const exMaxM2Final = exMaxM2.trim() || toM2(exMaxPy);
    const realMinM2Final = realMinM2.trim() || toM2(realMinPy);
    const realMaxM2Final = realMaxM2.trim() || toM2(realMaxPy);

    const payload: CreatePayload = {
      status: visibility,
      dealStatus,
      title,
      address,
      officeName,
      officePhone,
      officePhone2,
      moveIn,
      floor,
      roomNo,
      structure,
      aspect,
      aspectNo,
      ...(aspect1 ? { aspect1 } : {}),
      ...(aspect2 ? { aspect2 } : {}),
      ...(aspect3 ? { aspect3 } : {}),
      orientations,
      jeonsePrice,
      parkingGrade: starsToGrade(parkingStars),
      parkingType,
      completionDate,
      exclusiveArea: packRange(exMinM2Final, exMaxM2Final),
      realArea: packRange(realMinM2Final, realMaxM2Final),
      elevator,
      totalBuildings:
        totalBuildingsType === "select"
          ? totalBuildings
          : `${totalBuildings}(직접입력)`,
      totalFloors:
        totalFloorsType === "select" ? totalFloors : `${totalFloors}(직접입력)`,
      totalHouseholds:
        totalHouseholdsType === "select"
          ? totalHouseholds
          : `${totalHouseholds}(직접입력)`,
      remainingHouseholds:
        remainingHouseholdsType === "select"
          ? remainingHouseholds
          : `${remainingHouseholds}(직접입력)`,
      slopeGrade,
      structureGrade,
      options,
      optionEtc: etcChecked ? optionEtc.trim() : "",
      publicMemo,
      secretMemo: mode === "R" ? secretMemo : undefined,
      registry: registryOne,
      unitLines,
      images,
    };

    await onSubmit?.(payload);
    onClose();
  };

  /* ===================== 렌더 ===================== */
  return (
    <div className="fixed inset-0 z-[100]">
      {/* dim */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* panel */}
      <div className="absolute left-1/2 top-1/2 w-[980px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <HeaderSection
          title={title}
          mode={mode}
          visibility={visibility}
          dealStatus={dealStatus}
          toggleMode={toggleMode}
          setVisibility={setVisibility as (v: Visibility) => void}
          setDealStatus={setDealStatus as (v: DealStatus) => void}
          onClose={onClose}
        />

        {/* 바디 */}
        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          {/* 좌: 이미지 */}
          <ImagesSection
            images={images}
            fileInputs={fileInputs}
            onPickFile={onPickFile}
          />

          {/* 우: 상세 */}
          <div className="space-y-6">
            <BasicInfoSection
              title={title}
              setTitle={setTitle}
              address={address}
              setAddress={setAddress}
              officePhone={officePhone}
              setOfficePhone={setOfficePhone}
              officePhone2={officePhone2}
              setOfficePhone2={setOfficePhone2}
            />

            <NumbersSection
              numberItems={numberItems}
              totalBuildingsType={totalBuildingsType}
              setTotalBuildingsType={setTotalBuildingsType}
              totalBuildings={totalBuildings}
              setTotalBuildings={setTotalBuildings}
              totalFloorsType={totalFloorsType}
              setTotalFloorsType={setTotalFloorsType}
              totalFloors={totalFloors}
              setTotalFloors={setTotalFloors}
              totalHouseholdsType={totalHouseholdsType}
              setTotalHouseholdsType={setTotalHouseholdsType}
              totalHouseholds={totalHouseholds}
              setTotalHouseholds={setTotalHouseholds}
              remainingHouseholdsType={remainingHouseholdsType}
              setRemainingHouseholdsType={setRemainingHouseholdsType}
              remainingHouseholds={remainingHouseholds}
              setRemainingHouseholds={setRemainingHouseholds}
            />

            <AspectsSection
              aspects={aspects}
              addAspect={addAspect}
              removeAspect={removeAspect}
              setAspectDir={setAspectDir}
            />

            <ParkingSection
              parkingType={parkingType}
              setParkingType={setParkingType}
              parkingStars={parkingStars}
              setParkingStars={setParkingStars}
            />

            <CompletionPriceSection
              completionDate={completionDate}
              setCompletionDate={setCompletionDate}
              jeonsePrice={jeonsePrice}
              setJeonsePrice={setJeonsePrice}
            />

            <AreaSection
              exMinM2={exMinM2}
              setExMinM2={setExMinM2}
              exMaxM2={exMaxM2}
              setExMaxM2={setExMaxM2}
              exMinPy={exMinPy}
              setExMinPy={setExMinPy}
              exMaxPy={exMaxPy}
              setExMaxPy={setExMaxPy}
              realMinM2={realMinM2}
              setRealMinM2={setRealMinM2}
              realMaxM2={realMaxM2}
              setRealMaxM2={setRealMaxM2}
              realMinPy={realMinPy}
              setRealMinPy={setRealMinPy}
              realMaxPy={realMaxPy}
              setRealMaxPy={setRealMaxPy}
            />

            <RegistryGradeSection
              REGISTRY_LIST={REGISTRY_LIST}
              registry={registryOne}
              setRegistry={setRegistryOne}
              slopeGrade={slopeGrade}
              setSlopeGrade={setSlopeGrade}
              structureGrade={structureGrade}
              setStructureGrade={setStructureGrade}
            />

            <StructureLinesSection
              lines={unitLines}
              onAddPreset={addLineFromPreset}
              onAddEmpty={addEmptyLine}
              onUpdate={updateLine}
              onRemove={removeLine}
              presets={STRUCTURE_PRESETS}
            />

            <OptionsSection
              ALL_OPTIONS={ALL_OPTIONS}
              options={options}
              setOptions={setOptions}
              etcChecked={etcChecked}
              setEtcChecked={setEtcChecked}
              optionEtc={optionEtc}
              setOptionEtc={setOptionEtc}
            />

            <MemoSection
              mode={mode}
              value={memoValue}
              setValue={setMemoValue}
            />

            <FooterButtons
              onClose={onClose}
              onSave={save}
              canSave={isSaveEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
