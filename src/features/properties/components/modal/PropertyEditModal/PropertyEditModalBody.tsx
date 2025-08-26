"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  packRange,
  toM2,
  toPy,
  parsePreset,
} from "@/features/properties/lib/area";
import { parseRange } from "../PropertyViewModal/utils";
import { gradeToStars } from "@/features/properties/lib/grade";
import { buildOrientationFields } from "@/features/properties/lib/orientation";

import { UpdatePayload } from "@/features/properties/types/property-dto";
import type {
  DealStatus,
  Visibility,
  Registry,
  UnitLine,
  OrientationRow,
  Grade,
  OrientationValue,
  AspectRowLite,
} from "@/features/properties/types/property-domain";

import { PropertyEditModalProps } from "./types";
import { ALL_OPTIONS, STRUCTURE_PRESETS } from "../../common/constants";
import { REGISTRY_LIST } from "@/features/properties/types/property-domain";

// 섹션 컴포넌트들
import HeaderSection from "../../common/sections/HeaderSection";
import ImagesSection from "../../common/sections/ImagesSection";
import BasicInfoSection from "../../common/sections/BasicInfoSection";
import AspectsSection from "../../common/sections/AspectsSection";
import ParkingSection from "../../common/sections/ParkingSection";
import CompletionPriceSection from "../../common/sections/CompletionPriceSection";
import AreaSection from "../../common/sections/AreaSection";
import RegistryGradeSection from "../../common/sections/RegistryGradeSection";
import StructureLinesSection from "../../common/sections/StructureLinesSection";
import OptionsSection from "../../common/sections/OptionsSection";
import MemoSection from "../../common/sections/MemoSection";
import FooterButtons from "../../common/sections/FooterButtons";

/** 실제 훅/상태/렌더 */
export default function PropertyEditModalBody({
  open,
  item,
  onClose,
  onSubmit,
}: PropertyEditModalProps) {
  /* ---------- 이미지 ---------- */
  const [images, setImages] = useState<string[]>(["", "", "", ""]);
  const fileInputs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const onPickImage = (idx: number): void => {
    fileInputs[idx].current?.click();
  };

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

  /* ---------- 상태들 ---------- */
  const [visibility, setVisibility] = useState<Visibility>("공개");
  const [dealStatus, setDealStatus] = useState<DealStatus>("분양중");

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");

  const [aspects, setAspects] = useState<AspectRowLite[]>([{ no: 1, dir: "" }]);
  const addAspect = () =>
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  const removeAspect = (no: number) =>
    setAspects((prev) =>
      prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
    );
  const setAspectDir = (no: number, dir: OrientationValue | "") =>
    setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));

  const [parkingType, setParkingType] = useState("");
  const [parkingStars, setParkingStars] = useState(0);
  const [completionDate, setCompletionDate] = useState("");
  const [jeonsePrice, setJeonsePrice] = useState("");

  const [exMinM2, setExMinM2] = useState("");
  const [exMaxM2, setExMaxM2] = useState("");
  const [exMinPy, setExMinPy] = useState("");
  const [exMaxPy, setExMaxPy] = useState("");
  const [realMinM2, setRealMinM2] = useState("");
  const [realMaxM2, setRealMaxM2] = useState("");
  const [realMinPy, setRealMinPy] = useState("");
  const [realMaxPy, setRealMaxPy] = useState("");

  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();
  const [registry, setRegistry] = useState<Registry | undefined>();

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

  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");

  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");
  const [mode, setMode] = useState<"KN" | "R">("KN");
  const toggleMode = () => setMode((m) => (m === "KN" ? "R" : "KN"));
  const memoValue = mode === "KN" ? publicMemo : secretMemo;
  const setMemoValue = (v: string) =>
    mode === "KN" ? setPublicMemo(v) : setSecretMemo(v);

  const [unitLines, setUnitLines] = useState<UnitLine[]>([]);

  /* ---------- 프리필 ---------- */
  useEffect(() => {
    if (!open) return;
    setImages([
      item.images?.[0] ?? "",
      item.images?.[1] ?? "",
      item.images?.[2] ?? "",
      item.images?.[3] ?? "",
    ]);

    setVisibility(item.status ?? "공개");
    setDealStatus(item.dealStatus ?? "분양중");

    setTitle(item.title ?? "");
    setAddress(item.address ?? "");
    setOfficePhone(item.officePhone ?? "");
    setOfficePhone2(item.officePhone2 ?? "");

    const orient = (item.orientations ?? []) as OrientationRow[];
    if (orient.length > 0) {
      const rows: AspectRowLite[] = orient
        .filter((o) => o && typeof o.ho === "number")
        .sort((a, b) => a.ho - b.ho)
        .map(({ ho, value }) => ({
          no: ho,
          dir: (value ?? "") as AspectRowLite["dir"],
        }));
      setAspects(rows.length > 0 ? rows : [{ no: 1, dir: "" }]);
    } else {
      setAspects([{ no: 1, dir: "" }]);
    }

    setParkingType((item as any).parkingType ?? "");
    setParkingStars(gradeToStars((item as any).parkingGrade));
    setCompletionDate((item as any).completionDate ?? "");
    setJeonsePrice(item.jeonsePrice ?? "");

    const { min: exMin, max: exMax } = parseRange((item as any).exclusiveArea);
    const { min: realMin, max: realMax } = parseRange((item as any).realArea);

    setExMinM2(exMin);
    setExMaxM2(exMax);
    setExMinPy(toPy(exMin));
    setExMaxPy(toPy(exMax));

    setRealMinM2(realMin);
    setRealMaxM2(realMax);
    setRealMinPy(toPy(realMin));
    setRealMaxPy(toPy(realMax));

    setElevator(item.elevator ?? "O");
    setSlopeGrade(item.slopeGrade);
    setStructureGrade(item.structureGrade);
    setRegistry(item.registry);

    setTotalBuildings(((item as any).totalBuildings ?? "") + "");
    setTotalFloors(((item as any).totalFloors ?? "") + "");
    setTotalHouseholds(((item as any).totalHouseholds ?? "") + "");
    setRemainingHouseholds(((item as any).remainingHouseholds ?? "") + "");

    setUnitLines(item.unitLines?.length ? [...item.unitLines] : []);

    setOptions(item.options ?? []);
    setOptionEtc(item.optionEtc ?? "");
    setEtcChecked(!!(item.optionEtc && item.optionEtc.length > 0));
    setPublicMemo(item.publicMemo ?? "");
    setSecretMemo(item.secretMemo ?? "");
    setMode("KN");
  }, [open, item]);

  /* ---------- 숫자 셀렉트 공통 ---------- */
  const numberItems = useMemo(
    () => Array.from({ length: 20 }, (_, i) => `${i + 1}`),
    []
  );

  /* ---------- 유닛 라인 ---------- */
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

  /* ---------- 저장 ---------- */
  const save = async () => {
    const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
      buildOrientationFields(aspects);

    const payload: UpdatePayload = {
      status: visibility,
      dealStatus,
      title,
      address,
      officePhone,
      officePhone2,
      aspect,
      aspectNo,
      ...(aspect1 ? { aspect1 } : {}),
      ...(aspect2 ? { aspect2 } : {}),
      ...(aspect3 ? { aspect3 } : {}),
      orientations,
      jeonsePrice,
      parkingType,
      parkingGrade: ((): Grade | undefined => {
        if (parkingStars >= 4) return "상";
        if (parkingStars >= 2) return "중";
        if (parkingStars > 0) return "하";
        return undefined;
      })(),
      completionDate,
      exclusiveArea: packRange(exMinM2, exMaxM2),
      realArea: packRange(realMinM2, realMaxM2),
      elevator,
      slopeGrade,
      structureGrade,
      registry,
      totalBuildings,
      totalFloors,
      totalHouseholds,
      remainingHouseholds,
      options,
      optionEtc: etcChecked ? optionEtc.trim() : "",
      publicMemo,
      secretMemo: mode === "R" ? secretMemo : undefined,
      unitLines,
      images,
    };
    await onSubmit?.(payload);
    onClose();
  };

  const canSave = true; // 필요 시 기존 validation 적용

  /* ---------- 렌더 (✅ 딤 포함) ---------- */
  return (
    <div className="fixed inset-0 z-[1100]">
      {/* 딤 */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* 패널 */}
      <div
        className="absolute left-1/2 top-1/2 w-[980px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col z-[1]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <HeaderSection
          title={title}
          fallbackTitle={item.title}
          visibility={visibility}
          setVisibility={setVisibility}
          dealStatus={dealStatus}
          setDealStatus={setDealStatus}
          mode={mode}
          toggleMode={toggleMode}
          onClose={onClose}
        />

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <ImagesSection
            images={images}
            fileInputs={fileInputs}
            onPickFile={onPickFile}
          />
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
              registry={registry}
              setRegistry={setRegistry}
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

            {/* 오른쪽 정렬 버튼 */}
            <FooterButtons onClose={onClose} onSave={save} canSave={canSave} />
          </div>
        </div>
      </div>
    </div>
  );
}
