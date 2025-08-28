"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import HeaderSection from "../common/sections/HeaderSection";
import ImagesSection, {
  type ImageFile,
} from "../common/sections/ImagesSection";
import BasicInfoSection from "../common/sections/BasicInfoSection";
import NumbersSection from "../common/sections/NumbersSection";
import AspectsSection from "../common/sections/AspectsSection";
import ParkingSection from "../common/sections/ParkingSection";
import OptionsSection from "../common/sections/OptionsSection";
import MemoSection from "../common/sections/MemoSection";
import FooterButtons from "../common/sections/FooterButtons";
import StructureLinesSection from "../common/sections/StructureLinesSection";
import CompletionRegistrySection from "../common/sections/CompletionRegistrySection";
import AreaSetsSection, {
  type AreaSet,
} from "../common/sections/AreaSetsSection";

import { buildOrientationFields } from "@/features/properties/lib/orientation";
import {
  packRange,
  parsePreset,
  toM2,
  toPy,
} from "@/features/properties/lib/area";

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

import type { PropertyEditModalProps } from "./types";
import type {
  CreatePayload,
  UpdatePayload,
} from "@/features/properties/types/property-dto";
import { ALL_OPTIONS, STRUCTURE_PRESETS } from "../common/constants";

const MAX_PER_CARD = 20;
const MAX_FILES = 20;

const filled = (s: string) => s.trim().length > 0;
const hasPair = (min: string, max: string) => filled(min) && filled(max);
const setPack = (minM2: string, maxM2: string, minPy: string, maxPy: string) =>
  packRange(minM2.trim() || toM2(minPy), maxM2.trim() || toM2(maxPy));

// 타입 정규화
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

// "a~b" → {min, max}
const unpackRange = (s: unknown): { min: string; max: string } => {
  const raw = asStr(s).trim();
  if (!raw) return { min: "", max: "" };
  const [min, max] = raw.split("~", 2);
  return { min: (min ?? "").trim(), max: (max ?? "").trim() };
};

// OrientationRow 호환 추출
const pickOrientation = (o: unknown): string =>
  (o as any)?.dir ?? (o as any)?.direction ?? (o as any)?.value ?? "";

export default function PropertyEditModalBody({
  onClose,
  onSubmit,
  initialData,
}: Omit<PropertyEditModalProps, "open">) {
  // ---------- 이미지 ----------
  const [imagesByCard, setImagesByCard] = useState<ImageFile[][]>([[], []]);
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const registerImageInput = (idx: number, el: HTMLInputElement | null) => {
    imageInputRefs.current[idx] = el;
  };
  const openImagePicker = (idx: number) => imageInputRefs.current[idx]?.click();

  const onChangeImageCaption = (
    cardIdx: number,
    imageIdx: number,
    text: string
  ) => {
    setImagesByCard((prev) =>
      prev.map((arr, i) =>
        i !== cardIdx
          ? arr
          : arr.map((img, j) =>
              j === imageIdx ? { ...img, caption: text } : img
            )
      )
    );
  };

  const onPickFilesToCard = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;
    const newItems: ImageFile[] = Array.from(files).map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setImagesByCard((prev) => {
      const next = [...prev];
      const current = next[idx] ?? [];
      next[idx] = [...current, ...newItems].slice(0, MAX_PER_CARD);
      return next;
    });
    e.target.value = "";
  };

  const addPhotoFolder = () => setImagesByCard((prev) => [...prev, []]);

  const [fileItems, setFileItems] = useState<
    { name: string; url: string; caption?: string }[]
  >([]);
  const onAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items = Array.from(files).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setFileItems((prev) => [...prev, ...items].slice(0, MAX_FILES));
  };
  const onChangeFileItemCaption = (index: number, text: string) => {
    setFileItems((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption: text } : f))
    );
  };

  // ---------- 기본 필드 ----------
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [floor, setFloor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [structure, setStructure] = useState("3룸");

  // ---------- 향 ----------
  const [aspects, setAspects] = useState<AspectRowLite[]>([{ no: 1, dir: "" }]);
  const addAspect = () =>
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  const removeAspect = (no: number) =>
    setAspects((prev) =>
      prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
    );
  const setAspectDir = (no: number, dir: OrientationValue | "") =>
    setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));

  // ---------- 평점/주차/준공/매매 ----------
  const [listingStars, setListingStars] = useState(0);
  const [parkingType, setParkingType] = useState("");
  const [parkingCount, setParkingCount] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");

  // ---------- 면적 ----------
  const [baseAreaSet, setBaseAreaSet] = useState<AreaSet>({
    title: "개별 평수입력",
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

  // ---------- 엘리베이터/등기/등급 ----------
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [registryOne, setRegistryOne] = useState<Registry | undefined>();
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

  // ---------- 숫자 ----------
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

  // ---------- 옵션/메모 ----------
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");

  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");

  // ---------- 상태 ----------
  const [visibility, setVisibility] = useState<Visibility>("공개");
  const [dealStatus, setDealStatus] = useState<DealStatus>("분양중");

  // ---------- 구조 라인 ----------
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

  // ---------- 초기값 주입 ----------
  useEffect(() => {
    if (!initialData) return;

    // 이미지
    if (Array.isArray(initialData.images) && initialData.images.length > 0) {
      const mapped = initialData.images.map((u) =>
        typeof u === "string"
          ? { url: u, name: "" }
          : { url: u.url, name: u.name ?? "" }
      ); // mapped: ImageItem[]

      setImagesByCard([mapped, []]);
    }

    setTitle(initialData.title ?? "");
    setAddress(initialData.address ?? "");
    setOfficeName(initialData.officeName ?? "");
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

    // 면적 프리필
    const ex = unpackRange(initialData.exclusiveArea);
    const re = unpackRange(initialData.realArea);
    setBaseAreaSet({
      title: "개별 평수입력",
      exMinM2: ex.min,
      exMaxM2: ex.max,
      exMinPy: toPy(ex.min),
      exMaxPy: toPy(ex.max),
      realMinM2: re.min,
      realMaxM2: re.max,
      realMinPy: toPy(re.min),
      realMaxPy: toPy(re.max),
    });

    const exArr = Array.isArray(initialData.extraExclusiveAreas)
      ? initialData.extraExclusiveAreas
      : [];
    const reArr = Array.isArray(initialData.extraRealAreas)
      ? initialData.extraRealAreas
      : [];
    const len = Math.max(exArr.length, reArr.length);
    setExtraAreaSets(
      Array.from({ length: len }, (_, i) => {
        const exi = unpackRange(exArr[i] ?? "");
        const rei = unpackRange(reArr[i] ?? "");
        return {
          title: "개별 평수입력",
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

    // 등기/등급/엘베
    setElevator((initialData.elevator as "O" | "X") ?? "O");
    setRegistryOne(initialData.registry);
    setSlopeGrade(initialData.slopeGrade as Grade | undefined);
    setStructureGrade(initialData.structureGrade as Grade | undefined);

    // 숫자
    setTotalBuildings(asStr(initialData.totalBuildings));
    setTotalFloors(asStr(initialData.totalFloors));
    setTotalHouseholds(asStr(initialData.totalHouseholds));
    setRemainingHouseholds(asStr(initialData.remainingHouseholds));

    // 상태
    setVisibility(initialData.status ?? "공개");
    setDealStatus(initialData.dealStatus ?? "분양중");

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
        initialData.orientations.map((o, idx) => ({
          no: idx + 1,
          // ✅ dir 존재/이름이 달라도 안전
          dir: (pickOrientation(o) as OrientationValue) || "",
        }))
      );
    } else {
      const dirs = [
        initialData.aspect1,
        initialData.aspect2,
        initialData.aspect3,
      ].filter((v): v is string => !!v);
      if (dirs.length > 0) {
        setAspects(
          dirs.map((d, i) => ({ no: i + 1, dir: d as OrientationValue }))
        );
      }
    }
  }, [initialData]);

  // ---------- 유효성 ----------
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
    unitLines,
    listingStars,
    aspectsValid,
  ]);

  // ---------- 저장 ----------
  const save = async () => {
    if (!title.trim()) return;

    const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
      buildOrientationFields(aspects);

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

    const imagesFlat = imagesByCard.flat().map((f) => f.url);

    // ✅ 타입 주석 제거하고, 호출 시에만 캐스팅 (id도 문자열로 정규화)
    const payload = {
      id: String((initialData as any)?.id ?? ""),
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
      salePrice,
      parkingType,
      parkingCount,
      completionDate,
      exclusiveArea,
      realArea,
      elevator,
      totalBuildings,
      totalFloors,
      totalHouseholds,
      remainingHouseholds,
      slopeGrade,
      structureGrade,
      options,
      optionEtc: etcChecked ? optionEtc.trim() : "",
      publicMemo,
      secretMemo,
      registry: registryOne,
      unitLines,
      images: imagesFlat,
      extraExclusiveAreas,
      extraRealAreas,
    };

    await onSubmit?.(
      payload as unknown as UpdatePayload & Partial<CreatePayload>
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        <HeaderSection
          title={title}
          setTitle={setTitle}
          listingStars={listingStars}
          setListingStars={setListingStars}
          elevator={elevator}
          setElevator={setElevator}
          onClose={onClose}
        />

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <ImagesSection
            imagesByCard={imagesByCard}
            onOpenPicker={openImagePicker}
            onChangeFiles={onPickFilesToCard}
            registerInputRef={registerImageInput}
            onAddPhotoFolder={addPhotoFolder}
            maxPerCard={MAX_PER_CARD}
            onChangeCaption={onChangeImageCaption}
            fileItems={fileItems}
            onAddFiles={onAddFiles}
            onChangeFileItemCaption={onChangeFileItemCaption}
            maxFiles={MAX_FILES}
          />

          <div className="space-y-6">
            <BasicInfoSection
              address={address}
              setAddress={setAddress}
              officePhone={officePhone}
              setOfficePhone={setOfficePhone}
              officePhone2={officePhone2}
              setOfficePhone2={setOfficePhone2}
            />

            <NumbersSection
              numberItems={Array.from({ length: 20 }, (_, i) => `${i + 1}`)}
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

            <ParkingSection
              parkingType={parkingType}
              setParkingType={setParkingType}
              parkingCount={parkingCount}
              setParkingCount={setParkingCount}
            />

            <CompletionRegistrySection
              completionDate={completionDate}
              setCompletionDate={setCompletionDate}
              salePrice={salePrice}
              setSalePrice={setSalePrice}
              REGISTRY_LIST={REGISTRY_LIST}
              registry={registryOne}
              setRegistry={setRegistryOne}
              slopeGrade={slopeGrade}
              setSlopeGrade={setSlopeGrade}
              structureGrade={structureGrade}
              setStructureGrade={setStructureGrade}
            />

            <AspectsSection
              aspects={aspects}
              addAspect={addAspect}
              removeAspect={removeAspect}
              setAspectDir={setAspectDir}
            />

            <AreaSetsSection
              baseAreaSet={baseAreaSet}
              setBaseAreaSet={setBaseAreaSet}
              extraAreaSets={extraAreaSets}
              setExtraAreaSets={setExtraAreaSets}
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

            <div className="space-y-3">
              <MemoSection
                mode="KN"
                value={publicMemo}
                setValue={setPublicMemo}
              />
              <MemoSection
                mode="R"
                value={secretMemo}
                setValue={setSecretMemo}
              />
            </div>

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
