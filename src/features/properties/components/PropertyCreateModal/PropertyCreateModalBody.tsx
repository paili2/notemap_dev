"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { set as idbSet } from "idb-keyval";

import HeaderSection from "../sections/HeaderSection/HeaderSection";
import ImagesSection, {
  type ImageFile,
} from "../sections/ImagesSection/ImagesSection";
import BasicInfoSection from "../sections/BasicInfoSection/BasicInfoSection";
import NumbersSection from "../sections/NumbersSection/NumbersSection";
import AspectsSection from "../sections/AspectsSection/AspectsSection";
import ParkingSection from "../sections/ParkingSection/ParkingSection";
import OptionsSection from "../sections/OptionsSection/OptionsSection";
import MemoSection from "../sections/MemoSection/MemoSection";
import FooterButtons from "../sections/FooterButtons/FooterButtons";
import StructureLinesSection from "../sections/StructureLinesSection/StructureLinesSection";
import CompletionRegistrySection from "../sections/CompletionRegistrySection/CompletionRegistrySection";

import AreaSetsSection from "../sections/AreaSetsSection/AreaSetsSection";

import { buildOrientationFields } from "@/features/properties/lib/orientation";
import { packRange, toM2 } from "@/features/properties/lib/area";
import { parsePreset } from "@/features/properties/lib/structure";

import {
  type Registry,
  type UnitLine,
  type Grade,
  type OrientationValue,
  type AspectRowLite,
  REGISTRY_LIST,
} from "@/features/properties/types/property-domain";
import type { PropertyCreateModalProps } from "./types";
import type { CreatePayload } from "@/features/properties/types/property-dto";
import { PRESET_OPTIONS, STRUCTURE_PRESETS } from "../constants";
import { AreaSet } from "../sections/AreaSetsSection/types";
import { PinKind } from "@/features/map/pins";

/* -------------------- 상수 -------------------- */
const MAX_PER_CARD = 20;
const MAX_FILES = 20;

/* -------------------- 공용 유틸 -------------------- */
const filled = (s: string) => s.trim().length > 0;
const hasPair = (min: string, max: string) => filled(min) && filled(max);
const setPack = (minM2: string, maxM2: string, minPy: string, maxPy: string) =>
  packRange(minM2.trim() || toM2(minPy), maxM2.trim() || toM2(maxPy));

/* -------------------- 로컬 타입 -------------------- */
// 화면에서 쓰는 미리보기(IndexedDB에 Blob을 저장하고, 미리보기는 objectURL 사용)
type UIImage = {
  url: string; // blob:... 미리보기 URL (또는 원격 URL)
  name: string;
  caption?: string;
  idbKey?: string; // IndexedDB 키 (저장용)
};

// 우측 세로 리스트(미리보기 + 선택적으로 idbKey 포함)
type FileItem = {
  name: string;
  url: string;
  caption?: string;
  idbKey?: string;
};

/* -------------------- IndexedDB 저장 유틸 -------------------- */
const makeImgKey = (scope: "card" | "vertical") =>
  `prop:new:${scope}:${crypto.randomUUID()}`;

async function putBlobToIDB(key: string, blob: Blob) {
  await idbSet(key, blob);
}

/* ======================================================== */

export default function PropertyCreateModalBody({
  onClose,
  onSubmit,
  initialAddress,
}: Omit<PropertyCreateModalProps, "open">) {
  const [pinKind, setPinKind] = useState<PinKind>("1room");

  /* ---------- 이미지(좌측 카드형) ---------- */
  const [imageFolders, setImageFolders] = useState<UIImage[][]>([[]]); // 카드1, 카드2, ...
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const registerImageInput = (idx: number, el: HTMLInputElement | null) => {
    imageInputRefs.current[idx] = el;
  };
  const openImagePicker = (idx: number) => imageInputRefs.current[idx]?.click();

  const handleRemoveImage = (folderIdx: number, imageIdx: number) => {
    setImageFolders((prev) => {
      const next = prev.map((arr) => [...arr]);
      const removed = next[folderIdx]?.splice(imageIdx, 1)?.[0];
      if (removed?.url?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.url);
        } catch {}
      }
      return next;
    });
  };

  // 새 이미지 추가 → 즉시 IndexedDB 저장 + idbKey 부여
  const onPickFilesToFolder = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: UIImage[] = [];
    for (const f of Array.from(files)) {
      const key = makeImgKey("card");
      await putBlobToIDB(key, f);
      newItems.push({
        idbKey: key,
        url: URL.createObjectURL(f), // 미리보기
        name: f.name,
      });
    }

    setImageFolders((prev) => {
      const next = [...prev];
      const current = next[idx] ?? [];
      next[idx] = [...current, ...newItems].slice(0, MAX_PER_CARD);
      return next;
    });

    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = "";
  };

  const addPhotoFolder = () => setImageFolders((prev) => [...prev, []]);

  const onChangeImageCaption = (
    folderIdx: number,
    imageIdx: number,
    text: string
  ) => {
    setImageFolders((prev) =>
      prev.map((arr, i) =>
        i !== folderIdx
          ? arr
          : arr.map((img, j) =>
              j === imageIdx ? { ...img, caption: text } : img
            )
      )
    );
  };

  /* ---------- 이미지(우측 세로) ---------- */
  const [fileItems, setFileItems] = useState<FileItem[]>([]);

  const handleRemoveFileItem = (index: number) => {
    setFileItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.url?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.url);
        } catch {}
      }
      return next;
    });
  };

  const onAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const items: FileItem[] = [];
    for (const f of Array.from(files)) {
      const key = makeImgKey("vertical");
      await putBlobToIDB(key, f);
      items.push({
        name: f.name,
        url: URL.createObjectURL(f),
        idbKey: key,
      });
    }
    setFileItems((prev) => [...prev, ...items].slice(0, MAX_FILES));
  };

  const onChangeFileItemCaption = (index: number, text: string) => {
    setFileItems((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption: text } : f))
    );
  };

  useEffect(() => {
    return () => {
      imageFolders.flat().forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
      fileItems.forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
    };
    // 의존성 비우기: 컴포넌트 언마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 기본 필드들 ---------- */
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

  /* ---------- 유효성 ---------- */
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

  /* ---------- 저장 ---------- */
  const save = async () => {
    if (!title.trim()) return;
    try {
      console.time("save-build");

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

      // ------------- 이미지 포맷 -------------
      const imageCardsUI = imageFolders.map((card) =>
        card.map(({ url, name, caption }) => ({
          url,
          name,
          ...(caption ? { caption } : {}),
        }))
      );

      const imageFoldersStored = imageFolders.map((card) =>
        card.map(({ idbKey, url, name, caption }) =>
          idbKey
            ? { idbKey, name, ...(caption ? { caption } : {}) }
            : { url, name, ...(caption ? { caption } : {}) }
        )
      );

      const imagesFlatStrings: string[] = imageFolders.flat().map((f) => f.url);
      const imageCardCounts = imageFolders.map((card) => card.length);

      const verticalImagesStored = fileItems.map((f) =>
        f.idbKey
          ? {
              idbKey: f.idbKey,
              name: f.name,
              ...(f.caption ? { caption: f.caption } : {}),
            }
          : {
              url: f.url,
              name: f.name,
              ...(f.caption ? { caption: f.caption } : {}),
            }
      );
      const verticalImagesUI = fileItems.map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
        ...(f.idbKey ? { idbKey: f.idbKey } : {}),
      }));

      const payload: CreatePayload & {
        imageFolders: Array<
          Array<{
            idbKey?: string;
            url?: string;
            name?: string;
            caption?: string;
          }>
        >;
        imagesByCard: Array<
          Array<{ url: string; name: string; caption?: string }>
        >;
        imageCards: Array<
          Array<{ url: string; name: string; caption?: string }>
        >;
        imageCardCounts: number[];
        verticalImages: Array<{
          idbKey?: string;
          url?: string;
          name?: string;
          caption?: string;
        }>;
        images: string[];
        fileItems?: Array<{
          idbKey?: string;
          url?: string;
          name?: string;
          caption?: string;
        }>;
        extraExclusiveAreas: string[];
        extraRealAreas: string[];
      } = {
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

        imageFolders: imageFoldersStored,
        imagesByCard: imageCardsUI,
        imageCards: imageCardsUI,
        imageCardCounts,
        verticalImages: verticalImagesStored,

        images: imagesFlatStrings,
        fileItems: verticalImagesUI,

        extraExclusiveAreas,
        extraRealAreas,
      };

      console.timeEnd("save-build");
      console.log("[PropertyCreate] payload", payload);

      let ok = true;
      try {
        await Promise.resolve(onSubmit?.(payload));
      } catch (e) {
        ok = false;
        console.error("[PropertyCreate] onSubmit error:", e);
        alert("저장 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.");
      } finally {
        onClose();
      }
    } catch (e) {
      console.error("[PropertyCreate] save() failed before submit:", e);
      alert("저장 준비 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.");
    }
  };

  /* ---------- UI ---------- */
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
          pinKind={pinKind}
          setPinKind={setPinKind}
        />

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <ImagesSection
            imagesByCard={imageFolders as unknown as ImageFile[][]}
            onOpenPicker={openImagePicker}
            onChangeFiles={onPickFilesToFolder}
            registerInputRef={registerImageInput}
            onAddPhotoFolder={addPhotoFolder}
            maxPerCard={MAX_PER_CARD}
            onChangeCaption={onChangeImageCaption}
            onRemoveImage={handleRemoveImage}
            fileItems={fileItems}
            onAddFiles={onAddFiles}
            onChangeFileItemCaption={onChangeFileItemCaption}
            onRemoveFileItem={handleRemoveFileItem}
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
              totalBuildings={totalBuildings}
              setTotalBuildings={setTotalBuildings}
              totalFloors={totalFloors}
              setTotalFloors={setTotalFloors}
              totalHouseholds={totalHouseholds}
              setTotalHouseholds={setTotalHouseholds}
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
              PRESET_OPTIONS={PRESET_OPTIONS}
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
