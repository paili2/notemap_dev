"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { get as idbGet, set as idbSet } from "idb-keyval";

import HeaderSection from "../sections/HeaderSection/HeaderSection";
import ImagesSection, {
  type ImageFile,
} from "../sections/ImagesSection/ImagesSection";
import BasicInfoSection from "../sections/BasicInfoSection";
import NumbersSection from "../sections/NumbersSection/NumbersSection";
import AspectsSection from "../sections/AspectsSection";
import ParkingSection from "../sections/ParkingSection";
import OptionsSection from "../sections/OptionsSection/OptionsSection";
import MemoSection from "../sections/MemoSection";
import FooterButtons from "../sections/FooterButtons";
import StructureLinesSection from "../sections/StructureLinesSection/StructureLinesSection";
import CompletionRegistrySection from "../sections/CompletionRegistrySection/CompletionRegistrySection";
import AreaSetsSection from "../sections/AreaSetsSection/AreaSetsSection";

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
import { PRESET_OPTIONS, STRUCTURE_PRESETS } from "../constants";
import { AreaSet } from "../sections/AreaSetsSection/types";
import { PinKind } from "../sections/HeaderSection/components/PinTypeSelect";

/* -------------------- 상수 -------------------- */
const MAX_PER_CARD = 20;
const MAX_FILES = 20;

/* -------------------- 공용 유틸 -------------------- */
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

/* -------------------- 이미지 레퍼런스 타입 -------------------- */
type StoredImageRef =
  | { idbKey: string; name?: string; caption?: string }
  | { url: string; name?: string; caption?: string };

type UIImage = {
  url: string; // 미리보기 objectURL 또는 외부 URL
  name: string;
  caption?: string;
  idbKey?: string;
};

type AnyImageRef =
  | string
  | { url?: string; name?: string; caption?: string }
  | { idbKey: string; name?: string; caption?: string };

/* -------------------- IndexedDB 복원 -------------------- */
async function resolveImageRef(
  u: AnyImageRef
): Promise<{ url: string; name: string; caption?: string } | null> {
  if (typeof u === "string") return { url: u, name: "" };

  if (u && "idbKey" in (u as any) && typeof (u as any).idbKey === "string") {
    try {
      if ((u as any).idbKey.startsWith("url:")) {
        return {
          url: (u as any).idbKey.slice(4),
          name: (u as any).name ?? "",
          ...((u as any).caption ? { caption: (u as any).caption } : {}),
        };
      }
      const blob = await idbGet((u as any).idbKey);
      if (!blob) return null;
      const objectUrl = URL.createObjectURL(blob);
      return {
        url: objectUrl,
        name: (u as any).name ?? "",
        ...((u as any).caption ? { caption: (u as any).caption } : {}),
      };
    } catch {
      return null;
    }
  }

  if (
    u &&
    typeof u === "object" &&
    "url" in u &&
    typeof (u as any).url === "string"
  ) {
    return {
      url: (u as any).url,
      name: (u as any).name ?? "",
      ...((u as any).caption ? { caption: (u as any).caption } : {}),
    };
  }

  return null;
}

async function hydrateCards(
  src: AnyImageRef[][],
  maxPerCard: number
): Promise<UIImage[][]> {
  const cards = await Promise.all(
    src.map(async (card) => {
      const resolved = await Promise.all(card.map(resolveImageRef));
      const clean = resolved.filter(Boolean) as {
        url: string;
        name: string;
        caption?: string;
      }[];
      return clean.slice(0, maxPerCard).map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
      }));
    })
  );
  return cards.length ? cards : [[]];
}

async function hydrateFlatUsingCounts(
  src: AnyImageRef[],
  counts: number[]
): Promise<UIImage[][]> {
  const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
    Boolean
  ) as {
    url: string;
    name: string;
    caption?: string;
  }[];
  const out: UIImage[][] = [];
  let offset = 0;
  for (const c of counts) {
    const slice = resolved.slice(offset, offset + c);
    out.push(
      slice.map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
      }))
    );
    offset += c;
  }
  if (offset < resolved.length) {
    out.push(
      resolved.slice(offset).map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
      }))
    );
  }
  return out.length ? out : [[]];
}

async function hydrateFlatToCards(
  src: AnyImageRef[],
  maxPerCard: number
): Promise<UIImage[][]> {
  const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
    Boolean
  ) as {
    url: string;
    name: string;
    caption?: string;
  }[];
  const cards: UIImage[][] = [];
  for (let i = 0; i < resolved.length; i += maxPerCard) {
    cards.push(
      resolved.slice(i, i + maxPerCard).map((f) => ({
        url: f.url,
        name: f.name,
        ...(f.caption ? { caption: f.caption } : {}),
      }))
    );
  }
  return cards.length ? cards : [[]];
}

async function hydrateVertical(
  src: AnyImageRef[],
  maxFiles: number
): Promise<UIImage[]> {
  const resolved = (await Promise.all(src.map(resolveImageRef))).filter(
    Boolean
  ) as {
    url: string;
    name: string;
    caption?: string;
  }[];
  return resolved.slice(0, maxFiles).map((f) => ({
    url: f.url,
    name: f.name ?? "",
    ...(f.caption ? { caption: f.caption } : {}),
  }));
}

/* -------------------- IDB 저장 유틸 -------------------- */
const makeImgKey = (propertyId: string, scope: "card" | "vertical") =>
  `prop:${propertyId}:${scope}:${crypto.randomUUID()}`;

async function putBlobToIDB(key: string, blob: Blob) {
  await idbSet(key, blob);
}

/* ======================================================== */

export default function PropertyEditModalBody({
  onClose,
  onSubmit,
  initialData,
}: Omit<PropertyEditModalProps, "open">) {
  const [pinKind, setPinKind] = useState<PinKind>("1room"); // ✅ 핀 상태

  /* ---------- 이미지 ---------- */
  const [imageFolders, setImageFolders] = useState<UIImage[][]>([[]]); // 카드1, 카드2, ...
  const [verticalImages, setVerticalImages] = useState<UIImage[]>([]);
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

  // 새 이미지 추가 → 즉시 IndexedDB 저장 + idbKey 부여
  const onPickFilesToFolder = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const propertyId = String((initialData as any)?.id ?? "");
    const newItems: UIImage[] = [];

    for (const f of Array.from(files)) {
      const key = makeImgKey(propertyId, "card");
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

    e.target.value = "";
  };

  const addPhotoFolder = () => setImageFolders((prev) => [...prev, []]);

  const handleRemoveFileItem = (index: number) => {
    setVerticalImages((prev) => {
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

    const propertyId = String((initialData as any)?.id ?? "");
    const items: UIImage[] = [];

    for (const f of Array.from(files)) {
      const key = makeImgKey(propertyId, "vertical");
      await putBlobToIDB(key, f);
      items.push({
        idbKey: key,
        url: URL.createObjectURL(f),
        name: f.name,
      });
    }

    setVerticalImages((prev) => [...prev, ...items].slice(0, MAX_FILES));
  };

  const onChangeFileItemCaption = (index: number, text: string) => {
    setVerticalImages((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption: text } : f))
    );
  };

  useEffect(() => {
    return () => {
      imageFolders.flat().forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
      verticalImages.forEach((f) => {
        if (f?.url?.startsWith("blob:")) URL.revokeObjectURL(f.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 기본 필드들 ---------- */
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [floor, setFloor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [structure, setStructure] = useState("3룸");

  const [aspects, setAspects] = useState<AspectRowLite[]>([{ no: 1, dir: "" }]);
  const addAspect = () =>
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  const removeAspect = (no: number) =>
    setAspects((prev) =>
      prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
    );
  const setAspectDir = (no: number, dir: OrientationValue | "") =>
    setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));

  const [listingStars, setListingStars] = useState(0);
  const [parkingType, setParkingType] = useState("");
  const [parkingCount, setParkingCount] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [salePrice, setSalePrice] = useState("");

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

  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [registryOne, setRegistryOne] = useState<Registry | undefined>();
  const [slopeGrade, setSlopeGrade] = useState<Grade | undefined>();
  const [structureGrade, setStructureGrade] = useState<Grade | undefined>();

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

  const [visibility, setVisibility] = useState<Visibility>("공개");
  const [dealStatus, setDealStatus] = useState<DealStatus>("분양중");

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

  /* ---------- 초기값 주입 ---------- */
  useEffect(() => {
    if (!initialData) return;

    (async () => {
      const foldersRaw =
        (initialData as any).imageFolders ??
        (initialData as any).imagesByCard ??
        (initialData as any).imageCards ??
        null;

      if (Array.isArray(foldersRaw) && foldersRaw.length > 0) {
        setImageFolders(
          await hydrateCards(foldersRaw as AnyImageRef[][], MAX_PER_CARD)
        );
      } else {
        const flat = Array.isArray((initialData as any).images)
          ? ((initialData as any).images as AnyImageRef[])
          : null;
        const counts: number[] | undefined = (initialData as any)
          .imageCardCounts;

        if (flat && flat.length > 0) {
          if (Array.isArray(counts) && counts.length > 0) {
            setImageFolders(await hydrateFlatUsingCounts(flat, counts));
          } else {
            setImageFolders(await hydrateFlatToCards(flat, MAX_PER_CARD));
          }
        } else {
          setImageFolders([[]]);
        }
      }

      const verticalRaw =
        (initialData as any).verticalImages ??
        (initialData as any).imagesVertical ??
        (initialData as any).fileItems ??
        null;

      if (Array.isArray(verticalRaw) && verticalRaw.length > 0) {
        setVerticalImages(
          await hydrateVertical(verticalRaw as AnyImageRef[], MAX_FILES)
        );
      } else {
        setVerticalImages([]);
      }
    })();

    // 기타 필드 세팅 ...
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

    setElevator((initialData.elevator as "O" | "X") ?? "O");
    setRegistryOne(initialData.registry);
    setSlopeGrade(initialData.slopeGrade as Grade | undefined);
    setStructureGrade(initialData.structureGrade as Grade | undefined);

    setTotalBuildings(asStr(initialData.totalBuildings));
    setTotalFloors(asStr(initialData.totalFloors));
    setTotalHouseholds(asStr(initialData.totalHouseholds));
    setRemainingHouseholds(asStr(initialData.remainingHouseholds));

    setVisibility(initialData.status ?? "공개");
    setDealStatus(initialData.dealStatus ?? "분양중");

    setOptions(initialData.options ?? []);
    setOptionEtc(initialData.optionEtc ?? "");
    setEtcChecked(
      !!(initialData.optionEtc && initialData.optionEtc.length > 0)
    );
    setPublicMemo(initialData.publicMemo ?? "");
    setSecretMemo(initialData.secretMemo ?? "");

    setUnitLines(initialData.unitLines ?? []);

    if (
      Array.isArray(initialData.orientations) &&
      initialData.orientations.length > 0
    ) {
      setAspects(
        initialData.orientations.map((o, idx) => ({
          no: idx + 1,
          dir: (pickOrientation(o) as OrientationValue) || "",
        }))
      );
    } else {
      const dirs = [
        initialData.aspect1,
        initialData.aspect2,
        initialData.aspect3,
      ].filter((v): v is string => !!v);
      if (dirs.length > 0)
        setAspects(
          dirs.map((d, i) => ({ no: i + 1, dir: d as OrientationValue }))
        );
    }

    // ✅ 초기 핀 주입 (여기 추가)
    // 백엔드/기존 데이터에 따라 키가 다를 수 있어 안전하게 여러 키를 체크
    setPinKind(
      ((initialData as any).pinKind ??
        (initialData as any).kind ??
        (initialData as any).markerKind ??
        "1room") as PinKind
    );
  }, [initialData]);

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

    // 이미지 포맷
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

    const verticalImagesStored = verticalImages.map((f) =>
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
    const verticalImagesUI = verticalImages.map((f) => ({
      url: f.url,
      name: f.name,
      ...(f.caption ? { caption: f.caption } : {}),
      ...(f.idbKey ? { idbKey: f.idbKey } : {}),
    }));

    const payload = {
      id: String((initialData as any)?.id ?? ""),
      status: visibility,
      dealStatus,
      listingStars,
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

      // 이미지 관련
      imageFolders: imageFoldersStored,
      imagesByCard: imageCardsUI,
      imageCards: imageCardsUI,
      imageCardCounts,
      verticalImages: verticalImagesStored,
      fileItems: verticalImagesUI,
      images: imagesFlatStrings,

      extraExclusiveAreas,
      extraRealAreas,

      // ✅ 핀 종류(한 번만!)
      pinKind,
      // (호환용 별칭이 필요하면 유지)
      kind: pinKind,
      markerKind: pinKind,
    };

    await onSubmit?.(payload as any);
    onClose();
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
          onRefreshStars={() => setListingStars(0)}
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
            fileItems={verticalImages}
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
              slopeGrade={setSlopeGrade as any}
              setSlopeGrade={setSlopeGrade}
              structureGrade={setStructureGrade as any}
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
              etcChecked={setEtcChecked as any}
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
