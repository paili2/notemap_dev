"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import HeaderSection from "../common/sections/HeaderSection";
import ImagesSection from "../common/sections/ImagesSection";
import BasicInfoSection from "../common/sections/BasicInfoSection";
import NumbersSection from "../common/sections/NumbersSection";
import AspectsSection from "../common/sections/AspectsSection";
import ParkingSection from "../common/sections/ParkingSection";
import OptionsSection from "../common/sections/OptionsSection";
import MemoSection from "../common/sections/MemoSection";
import FooterButtons from "../common/sections/FooterButtons";
import StructureLinesSection from "../common/sections/StructureLinesSection";
import CompletionRegistrySection from "../common/sections/CompletionRegistrySection";

import AreaSetsSection from "../common/sections/AreaSetsSection";
import type { AreaSet } from "../common/sections/AreaSetsSection";

import { buildOrientationFields } from "@/features/properties/lib/orientation";
import { packRange, toM2 } from "@/features/properties/lib/area";
import { parsePreset } from "@/features/properties/lib/structure";

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
import { ALL_OPTIONS, STRUCTURE_PRESETS } from "../common/constants";
import type { ImageFile } from "../common/sections/ImagesSection";

const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

// 이미지/파일 업로드 제한
const MAX_PER_CARD = 20;
const MAX_FILES = 20;

type FileItem = { name: string; url: string; caption?: string };

const filled = (s: string) => s.trim().length > 0;
const hasPair = (min: string, max: string) => filled(min) && filled(max);
const setPack = (minM2: string, maxM2: string, minPy: string, maxPy: string) =>
  packRange(minM2.trim() || toM2(minPy), maxM2.trim() || toM2(maxPy));

export default function PropertyCreateModalBody({
  onClose,
  onSubmit,
  initialAddress,
}: Omit<PropertyCreateModalProps, "open">) {
  const [imagesByCard, setImagesByCard] = useState<ImageFile[][]>([[], []]); // 내부 미리보기 전용
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const registerImageInput = (idx: number, el: HTMLInputElement | null) => {
    imageInputRefs.current[idx] = el;
  };
  const openImagePicker = (idx: number) => imageInputRefs.current[idx]?.click();

  const onChangeFileItemCaption = (index: number, text: string) => {
    setFileItems((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption: text } : f))
    );
  };

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

  const onPickFilesToCard = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: ImageFile[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await readAsDataURL(f); // ✅ dataUrl 생성
      newItems.push({
        url: URL.createObjectURL(f), // 미리보기용 blob
        dataUrl, // 저장/뷰용 data URL
        name: f.name,
      });
    }

    setImagesByCard((prev) => {
      const next = [...prev];
      const current = next[idx] ?? [];
      next[idx] = [...current, ...newItems].slice(0, MAX_PER_CARD);
      return next;
    });

    e.target.value = "";
  };

  const addPhotoFolder = () => setImagesByCard((prev) => [...prev, []]);

  // objectURL 정리 (언마운트 시 메모리 누수 방지)
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  useEffect(() => {
    return () => {
      imagesByCard.flat().forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
      fileItems.forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesByCard]);

  const onAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items: FileItem[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await readAsDataURL(f);
      items.push({ name: f.name, url: dataUrl });
    }
    setFileItems((prev) => [...prev, ...items].slice(0, MAX_FILES));
  };

  const [title, setTitle] = useState("");
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

  // 매물평점/주차/준공/매매가
  const [listingStars, setListingStars] = useState(0);
  const [parkingType, setParkingType] = useState("");
  const [parkingCount, setParkingCount] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");

  // 면적
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

  // 엘리베이터/등기/등급
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [registryOne, setRegistryOne] = useState<Registry | undefined>();
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

  // 숫자
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

  // 옵션
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");

  // 메모
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");

  // 상태
  const [visibility, setVisibility] = useState<Visibility>("공개");
  const [dealStatus, setDealStatus] = useState<DealStatus>("분양중");

  // 구조별 입력
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

  // 유효성
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

  // 저장
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

    const imageCards = imagesByCard.map((card) =>
      card.map((f) => ({
        // 새로고침 후에도 살아있는 data: URL을 기본 url로 저장
        url: f.dataUrl ?? f.url,
        dataUrl: f.dataUrl,
        name: f.name ?? "",
        caption: f.caption ?? "",
      }))
    );

    const fileItemsPayload = fileItems.map((f) => ({
      url: f.url, // 여긴 dataUrl 저장 중이니 그대로 사용 가능
      name: f.name,
      caption: f.caption ?? "",
    }));

    // (레거시) 합친 이미지 배열도 유지 — 기존 화면/타입 호환
    const imagesFlat = imagesByCard.flat().map((f) => f.dataUrl ?? f.url);

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
      salePrice,
      parkingType,
      parkingCount,
      completionDate,
      exclusiveArea,
      realArea,
      listingStars,
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
      secretMemo,
      registry: registryOne,
      unitLines,

      images: imagesFlat, // 레거시
      imageCards, // 카드별 그룹
      fileItems: fileItemsPayload,
    };

    await onSubmit?.(payload);
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

            {/* ✅ 타입 오류 수정: value/Setter 올바르게 전달 */}
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
          </div>
        </div>
        <FooterButtons
          onClose={onClose}
          onSave={save}
          canSave={isSaveEnabled}
        />
      </div>
    </div>
  );
}
