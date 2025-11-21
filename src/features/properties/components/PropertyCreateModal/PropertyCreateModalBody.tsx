"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";

import FooterButtons from "../sections/FooterButtons/FooterButtons";
import type { PropertyCreateModalProps } from "./types";
import {
  MAX_FILES,
  MAX_PER_CARD,
  PRESET_OPTIONS,
  STRUCTURE_PRESETS,
} from "../constants";
import { usePropertyImages } from "./hooks/usePropertyImages";
import { buildCreatePayload } from "./lib/buildCreatePayload";
import { useCreateForm } from "./hooks/useCreateForm/useCreateForm";

import HeaderContainer from "./ui/HeaderContainer";
import ImagesContainer from "./ui/ImagesContainer";
import BasicInfoContainer from "./ui/BasicInfoContainer";
import NumbersContainer from "./ui/NumbersContainer";
import ParkingContainer from "./ui/ParkingContainer";
import CompletionRegistryContainer from "./ui/CompletionRegistryContainer";
import AspectsContainer from "./ui/AspectsContainer";
import AreaSetsContainer from "./ui/AreaSetsContainer";
import StructureLinesContainer from "./ui/StructureLinesContainer";
import OptionsContainer from "./ui/OptionsContainer";
import MemosContainer from "./ui/MemosContainer";
import { mapPinKindToBadge } from "../../lib/badge";

import { api } from "@/shared/api/api";
import { createPin, CreatePinDto } from "@/shared/api/pins";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";

import { buildAreaGroups } from "@/features/properties/lib/area";
import type { AreaSet as StrictAreaSet } from "@/features/properties/components/sections/AreaSetsSection/types";
import { todayYmdKST } from "@/shared/date/todayYmdKST";
import type { UnitLine } from "@/features/properties/types/property-domain";
import type { PinKind } from "@/features/pins/types";

/* ───────────── 미디어 영속화 단계 API ───────────── */
import { createPhotoGroup } from "@/shared/api/photoGroups";
import { uploadPhotosAndGetUrls } from "@/shared/api/photoUpload";
import { createPhotosInGroup } from "@/shared/api/photos";
import type { ImageItem } from "@/features/properties/types/media";

/* === 날짜 유틸 === */
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/** 8자리 숫자(YYYYMMDD)는 YYYY-MM-DD로 포맷, 그 외는 트림만 */
const normalizeDateInput = (raw?: string | null): string => {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (/^\d{8}$/.test(s)) {
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(4, 6));
    const d = Number(s.slice(6, 8));
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }
  return s;
};

/** 정확히 YYYY-MM-DD 형식 + 실제 존재하는 날짜만 true */
const isValidIsoDateStrict = (s?: string | null): boolean => {
  const v = String(s ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map((x) => Number(x));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
};

/* === 신축/구옥 보정 === */
const toBoolUndef = (v: unknown): boolean | undefined => {
  if (typeof v === "boolean") return v;
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (!s) return undefined;
  if (["y", "yes", "1", "true", "o"].includes(s)) return true;
  if (["n", "no", "0", "false", "x"].includes(s)) return false;
  return undefined;
};

/** ✅ 실제 답사예정 핀 kind 값: PinKind 중 "question" 을 사용 */
const VISIT_PLAN_PIN_KIND: PinKind = "question";

/** pinKind 값이 '답사예정핀'인지 판별 */
const isVisitPlanPinKind = (pinKind: any): boolean =>
  String(pinKind) === VISIT_PLAN_PIN_KIND;

/** ✅ asInner: true면 카드 안 내용만 렌더(딤/포털 없음) */
type Props = Omit<PropertyCreateModalProps, "open"> & {
  asInner?: boolean;
};

export default function PropertyCreateModalBody({
  onClose,
  onSubmit,
  initialAddress,
  initialLat,
  initialLng,
  pinDraftId,
  asInner,
}: Props) {
  const f = useCreateForm({ initialAddress });

  // ✅ 최초 마운트 시 핀 종류를 "답사예정(question)" 으로 강제 설정
  const didInitPinKindRef = useRef(false);
  useEffect(() => {
    if (didInitPinKindRef.current) return;

    const setPinKind = (f as any).setPinKind as
      | ((kind: PinKind) => void)
      | undefined;

    if (typeof setPinKind === "function") {
      setPinKind(VISIT_PLAN_PIN_KIND);
      didInitPinKindRef.current = true;
    }
  }, [f]);

  const {
    imageFolders,
    fileItems,
    registerImageInput: registerImageInputRaw,
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,

    // ⬇️ 폴더 메타 (제목) 관리용
    groups,
    queueGroupTitle,
  } = usePropertyImages();

  /** ───── ref 콜백 안정화 + detach 처리 + 지연 등록 ───── */
  type RefEntry = {
    cb: (el: HTMLInputElement | null) => void;
    lastNode: HTMLInputElement | null;
  };
  const refCache = useRef<Map<number, RefEntry>>(new Map());

  const deferredRegister = (idx: number, node: HTMLInputElement) => {
    queueMicrotask(() => {
      const cur = refCache.current.get(idx);
      if (cur?.lastNode === node) {
        registerImageInputRaw(idx, node);
      }
    });
  };

  const registerImageInputCompat = useCallback(
    ((idx: number, el?: HTMLInputElement | null) => {
      if (arguments.length === 2) {
        const entry =
          refCache.current.get(idx) ??
          ({ cb: () => void 0, lastNode: null } as RefEntry);
        const node = el ?? null;

        if (node === null) {
          if (entry.lastNode !== null) {
            entry.lastNode = null;
            refCache.current.set(idx, entry);
          }
          return;
        }
        if (entry.lastNode === node) return;
        entry.lastNode = node;
        refCache.current.set(idx, entry);
        deferredRegister(idx, node);
        return;
      }

      let entry = refCache.current.get(idx);
      if (!entry) {
        const stable = (node: HTMLInputElement | null) => {
          const cur =
            refCache.current.get(idx) ??
            ({ cb: stable, lastNode: null } as RefEntry);
          if (node === null) {
            if (cur.lastNode !== null) {
              cur.lastNode = null;
              refCache.current.set(idx, cur);
            }
            return;
          }
          if (cur.lastNode === node) return;
          cur.lastNode = node;
          refCache.current.set(idx, cur);
          deferredRegister(idx, node);
        };
        entry = { cb: stable, lastNode: null };
        refCache.current.set(idx, entry);
      }
      return entry.cb;
    }) as {
      (idx: number): (el: HTMLInputElement | null) => void;
      (idx: number, el: HTMLInputElement | null): void;
    },
    [registerImageInputRaw]
  );

  /** ───── 이미지 핸들러 안정 래퍼 ───── */
  type ImageHandlers = {
    openImagePicker: typeof openImagePicker;
    onPickFilesToFolder: typeof onPickFilesToFolder;
    addPhotoFolder: typeof addPhotoFolder;
    removePhotoFolder: typeof removePhotoFolder;
    onChangeImageCaption: typeof onChangeImageCaption;
    handleRemoveImage: typeof handleRemoveImage;
    onAddFiles: typeof onAddFiles;
    onChangeFileItemCaption: typeof onChangeFileItemCaption;
    handleRemoveFileItem: typeof handleRemoveFileItem;
  };

  const handlersRef = useRef<ImageHandlers>({
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
  });

  useEffect(() => {
    handlersRef.current = {
      openImagePicker,
      onPickFilesToFolder,
      addPhotoFolder,
      removePhotoFolder,
      onChangeImageCaption,
      handleRemoveImage,
      onAddFiles,
      onChangeFileItemCaption,
      handleRemoveFileItem,
    };
  }, [
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    removePhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
  ]);

  const stable_openImagePicker = useCallback(
    (...args: Parameters<ImageHandlers["openImagePicker"]>) =>
      handlersRef.current.openImagePicker(...args),
    []
  );
  const stable_onPickFilesToFolder = useCallback(
    (...args: Parameters<ImageHandlers["onPickFilesToFolder"]>) =>
      handlersRef.current.onPickFilesToFolder(...args),
    []
  );
  const stable_addPhotoFolder = useCallback(
    (...args: Parameters<ImageHandlers["addPhotoFolder"]>) =>
      handlersRef.current.addPhotoFolder(...args),
    []
  );
  const stable_removePhotoFolder = useCallback(
    (...args: Parameters<ImageHandlers["removePhotoFolder"]>) =>
      handlersRef.current.removePhotoFolder(...args),
    []
  );
  const stable_onChangeImageCaption = useCallback(
    (...args: Parameters<ImageHandlers["onChangeImageCaption"]>) =>
      handlersRef.current.onChangeImageCaption(...args),
    []
  );
  const stable_handleRemoveImage = useCallback(
    (...args: Parameters<ImageHandlers["handleRemoveImage"]>) =>
      handlersRef.current.handleRemoveImage(...args),
    []
  );
  const stable_onAddFiles = useCallback(
    (...args: Parameters<ImageHandlers["onAddFiles"]>) =>
      handlersRef.current.onAddFiles(...args),
    []
  );
  const stable_onChangeFileItemCaption = useCallback(
    (...args: Parameters<ImageHandlers["onChangeFileItemCaption"]>) =>
      handlersRef.current.onChangeFileItemCaption(...args),
    []
  );
  const stable_handleRemoveFileItem = useCallback(
    (...args: Parameters<ImageHandlers["handleRemoveFileItem"]>) =>
      handlersRef.current.handleRemoveFileItem(...args),
    []
  );

  // 예약/드래프트 정리
  const {
    removeByReservationId: removeReservation,
    removeByPinDraftId: removeDraft,
  } = useScheduledReservations();

  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── 전화번호(KR) 유틸 ──
  const normalizePhone = (v: string) => v.replace(/[^\d]/g, "");
  const isValidPhoneKR = (raw?: string | null) => {
    const s = (raw ?? "").trim();
    if (!s) return false;
    const v = normalizePhone(s);
    if (!/^0\d{9,10}$/.test(v)) return false;
    if (v.startsWith("02")) return v.length === 9 || v.length === 10;
    return v.length === 10 || v.length === 11;
  };

  const toStrictAreaSet = (s: any): StrictAreaSet => ({
    title: String(s?.title ?? ""),
    exMinM2: String(s?.exMinM2 ?? ""),
    exMaxM2: String(s?.exMaxM2 ?? ""),
    exMinPy: String(s?.exMinPy ?? ""),
    exMaxPy: String(s?.exMaxPy ?? ""),
    realMinM2: String(s?.realMinM2 ?? ""),
    realMaxM2: String(s?.realMaxM2 ?? ""),
    realMinPy: String(s?.realMinPy ?? ""),
    realMaxPy: String(s?.realMaxPy ?? ""),
  });

  /* ───────────── 수치 파싱 & 검증 유틸 ───────────── */
  const numOrNull = (v: any): number | null => {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number(s.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  /** min/max가 모두 채워졌을 때만 비교. 단, 0은 단독으로도 금지 */
  const isInvalidRange = (min: any, max: any) => {
    const a = numOrNull(min);
    const b = numOrNull(max);
    if (a === 0 || b === 0) return true;
    if (a != null && b != null) return b <= a;
    return false;
  };

  // === 구조별 입력(최소/최대 매매가) 검증
  const priceOrNull = (v: any): number | null => {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number(s.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const validateUnitPriceRanges = (units?: any[]): string | null => {
    if (!Array.isArray(units)) return null;
    for (let i = 0; i < units.length; i++) {
      const u = units[i] ?? {};
      const min = priceOrNull(u?.minPrice ?? u?.primary);
      const max = priceOrNull(u?.maxPrice ?? u?.secondary);

      if (min === 0 || max === 0) {
        const label = (u?.label ?? u?.name ?? `${i + 1}번째 구조`).toString();
        return `${label}: 0원은 입력할 수 없습니다.`;
      }

      if (min != null && max != null && max <= min) {
        const label = (u?.label ?? u?.name ?? `${i + 1}번째 구조`).toString();
        return `${label}: 최대매매가는 최소매매가보다 커야 합니다.`;
      }
    }
    return null;
  };

  // === 개별 평수 입력(전용/실평) 검증
  const validateAreaSets = (): string | null => {
    const base = f.baseAreaSet ?? {};
    const extras = Array.isArray(f.extraAreaSets) ? f.extraAreaSets : [];

    const checkOne = (set: any, titleForMsg: string) => {
      const pairs: Array<[any, any, string]> = [
        [set?.exMinM2, set?.exMaxM2, "전용(㎡)"],
        [set?.exMinPy, set?.exMaxPy, "전용(평)"],
        [set?.realMinM2, set?.realMaxM2, "실평(㎡)"],
        [set?.realMinPy, set?.realMaxPy, "실평(평)"],
      ];

      for (const [a, b, label] of pairs) {
        const na = numOrNull(a);
        const nb = numOrNull(b);
        if (na === 0 || nb === 0) {
          return `${titleForMsg} - ${label}: 0은 입력할 수 없습니다.`;
        }
      }
      for (const [a, b, label] of pairs) {
        if (isInvalidRange(a, b)) {
          return `${titleForMsg} - ${label}: 최대값은 최소값보다 커야 합니다.`;
        }
      }
      return null;
    };

    const baseErr = checkOne(base, base?.title?.trim() || "기본 면적");
    if (baseErr) return baseErr;

    for (let i = 0; i < extras.length; i++) {
      const set = extras[i] ?? {};
      const title = set?.title?.trim() || `면적 그룹 ${i + 1}`;
      const err = checkOne(set, title);
      if (err) return err;
    }

    return null;
  };

  /* ───────────── 업로드 대상 선별 & File 변환 ───────────── */
  const isUploadable = (u?: string) =>
    !!u && (/^blob:/.test(u) || /^data:/.test(u));

  const imageItemToFile = useCallback(
    async (img: ImageItem, fallbackName: string) => {
      const src = img?.dataUrl ?? img?.url ?? "";
      if (!isUploadable(src)) return null;
      const resp = await fetch(src);
      const blob = await resp.blob();
      const ext =
        (blob.type && blob.type.split("/")[1]) ||
        (img?.name?.split(".").pop() ?? "jpg");
      const name =
        (img?.name && img.name.trim()) || `${fallbackName}.${ext || "jpg"}`;
      return new File([blob], name, {
        type: blob.type || "application/octet-stream",
      });
    },
    []
  );

  /** 중복 방지: 카드별/세로파일 업로드 1회 보장 */
  const processedCardSetRef = useRef<Set<number>>(new Set());
  const processedVerticalRef = useRef<boolean>(false);

  /** 🔍 groups 에서 id 로 찾아오는 헬퍼 */
  const findGroupById = useCallback(
    (id: string) => {
      if (!Array.isArray(groups)) return undefined;
      return groups.find((g: any) => String(g?.id) === String(id));
    },
    [groups]
  );

  /** 카드 하나: 업로드 → urls 있으면 그룹 생성 → /photos 등록 */
  const persistOneCard = useCallback(
    async (pinId: string | number, folderIdx: number) => {
      if (processedCardSetRef.current.has(folderIdx)) return;
      processedCardSetRef.current.add(folderIdx);

      const folderAny = (imageFolders as any[])[folderIdx];
      const isFolderObject =
        folderAny && typeof folderAny === "object" && "items" in folderAny;

      const groupImages: ImageItem[] = isFolderObject
        ? (folderAny.items as ImageItem[]) ?? []
        : Array.isArray(folderAny)
        ? (folderAny as ImageItem[])
        : [];

      if (!groupImages.length) return;

      // 🔹 id 기반으로 메타 찾기
      const pseudoId = `folder-${folderIdx}`;
      const groupMeta = findGroupById(pseudoId);

      const titleFromFolder =
        isFolderObject && typeof (folderAny as any).title === "string"
          ? String((folderAny as any).title).trim()
          : "";

      const titleFromGroup =
        groupMeta && typeof groupMeta.title === "string"
          ? String(groupMeta.title).trim()
          : "";

      const effectiveTitle =
        titleFromGroup || titleFromFolder || `카드 ${folderIdx + 1}`;

      try {
        const filePromises = groupImages.map((img, i) =>
          imageItemToFile(img, `card-${folderIdx + 1}-${i + 1}`)
        );
        const files = (await Promise.all(filePromises)).filter(
          (f): f is File => !!f
        );

        if (files.length === 0) return;

        const urls = await uploadPhotosAndGetUrls(files, { domain: "map" });
        if (!urls.length) return;

        const group = await createPhotoGroup({
          pinId,
          title: effectiveTitle,
          sortOrder: folderIdx,
          isDocument: false,
        });

        const sortOrders = urls.map((_, i) => i);
        await createPhotosInGroup(String(group.id), {
          urls,
          sortOrders,
          isCover: folderIdx === 0,
        });
      } catch (err) {
        console.warn("[persistOneCard] failed at folder", folderIdx, err);
      }
    },
    [imageFolders, imageItemToFile, findGroupById]
  );

  /** 세로 파일 처리 */
  const persistVerticalFiles = useCallback(
    async (pinId: string | number) => {
      if (processedVerticalRef.current) return;
      processedVerticalRef.current = true;

      try {
        const filePromises = fileItems.map((it, i) =>
          imageItemToFile(it, `file-${i + 1}`)
        );
        const files = (await Promise.all(filePromises)).filter(
          (f): f is File => !!f
        );

        if (files.length === 0) return;

        const urls = await uploadPhotosAndGetUrls(files, { domain: "map" });
        if (!urls.length) return;

        // 🔹 "__vertical__" id 로 메타 찾기
        const verticalMeta = findGroupById("__vertical__");
        const verticalTitleFromMeta =
          verticalMeta && typeof verticalMeta.title === "string"
            ? String(verticalMeta.title).trim()
            : "";

        const effectiveVerticalTitle = verticalTitleFromMeta || "세로 파일";

        const group = await createPhotoGroup({
          pinId,
          title: effectiveVerticalTitle,
          sortOrder: (imageFolders as any[]).length,
          isDocument: true,
        });

        const sortOrders = urls.map((_, i) => i);
        await createPhotosInGroup(String(group.id), {
          urls,
          sortOrders,
          isCover: false,
        });
      } catch (err) {
        console.warn("[persistVerticalFiles] failed", err);
      }
    },
    [fileItems, imageFolders, imageItemToFile, findGroupById]
  );

  /* ── ParkingContainer 어댑터 ── */
  const parkingForm = useMemo(
    () => ({
      parkingTypeId: (f as any).parkingTypeId ?? null,
      setParkingTypeId: (v: number | null) => {
        const setter = (f as any).setParkingTypeId as
          | ((next: number | null) => void)
          | undefined;
        if (setter) setter(v);
      },

      parkingType: f.parkingType ?? null,
      setParkingType: (v: string | null) => f.setParkingType(v ?? ""),

      totalParkingSlots:
        f.totalParkingSlots == null ? null : String(f.totalParkingSlots),
      setTotalParkingSlots: (v: string | null) => {
        if (v == null) {
          f.setTotalParkingSlots(null);
          return;
        }
        const s = String(v).trim();
        if (!s) {
          f.setTotalParkingSlots(null);
          return;
        }
        const n = Number(s);
        f.setTotalParkingSlots(Number.isFinite(n) ? n : null);
      },
    }),
    [
      f.parkingType,
      f.totalParkingSlots,
      f.setParkingType,
      f.setTotalParkingSlots,
      (f as any).parkingTypeId,
      (f as any).setParkingTypeId,
    ]
  );

  /* === 생성 카드 내부 스크롤 컨테이너의 가로 스크롤 강제 리셋 === */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollLeft !== 0) {
        el.scrollLeft = 0;
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (!f.title.trim()) return;

      const latNum = Number(initialLat);
      const lngNum = Number(initialLng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        alert("좌표가 유효하지 않습니다. (initialLat/initialLng 미전달)");
        return;
      }

      // 🔹 가로 카드 폴더 제목 검증 (id 기반)
      {
        const foldersAny = imageFolders as any[];

        for (let idx = 0; idx < foldersAny.length; idx++) {
          const folder = foldersAny[idx];
          const isFolderObject =
            folder && typeof folder === "object" && "items" in folder;
          if (!isFolderObject) continue;

          const items: ImageItem[] = Array.isArray(folder.items)
            ? (folder.items as ImageItem[])
            : [];
          if (!items.length) continue;

          const titleFromFolder =
            typeof folder.title === "string" ? folder.title.trim() : "";

          const meta = findGroupById(`folder-${idx}`);
          const titleFromGroup =
            meta && typeof meta.title === "string"
              ? String(meta.title).trim()
              : "";

          const effectiveTitle = titleFromFolder || titleFromGroup;

          if (!effectiveTitle) {
            alert(`가로 카드 ${idx + 1}의 폴더 이름을 입력해 주세요.`);
            return;
          }
        }
      }

      // 전화번호 검증 (메인 필수)
      if (!isValidPhoneKR(f.officePhone)) {
        alert("전화번호를 입력해주세요");
        return;
      }
      if ((f.officePhone2 ?? "").trim() && !isValidPhoneKR(f.officePhone2)) {
        alert("전화번호를 입력해주세요");
        return;
      }

      // ✅ 준공일 형식 검증
      let completionDateNormalized = (f.completionDate ?? "").trim();
      if (completionDateNormalized) {
        completionDateNormalized = normalizeDateInput(completionDateNormalized);
        if (completionDateNormalized !== f.completionDate) {
          f.setCompletionDate(completionDateNormalized);
        }
        if (!isValidIsoDateStrict(completionDateNormalized)) {
          alert("준공일은 YYYY-MM-DD 형식으로 입력해주세요. 예: 2024-04-14");
          return;
        }
      }

      // 구조별 입력 가격 검증
      {
        const msg = validateUnitPriceRanges(f.unitLines);
        if (msg) {
          alert(msg);
          return;
        }
      }

      // 개별 평수 입력 검증
      {
        const msg = validateAreaSets();
        if (msg) {
          alert(msg);
          return;
        }
      }

      const badgeFromKind = mapPinKindToBadge(f.pinKind);
      const effectiveBadge = f.badge ?? badgeFromKind ?? undefined;

      const effectiveCompletionDate = completionDateNormalized || todayYmdKST();

      const strictBase = toStrictAreaSet(f.baseAreaSet);
      const strictExtras = (
        Array.isArray(f.extraAreaSets) ? f.extraAreaSets : []
      ).map(toStrictAreaSet);
      const areaGroups = buildAreaGroups(strictBase, strictExtras);

      const payload = buildCreatePayload({
        title: f.title,
        address: f.address,
        badge: effectiveBadge,
        officeName: f.officeName,
        officePhone: f.officePhone,
        officePhone2: f.officePhone2,
        moveIn: f.moveIn,
        floor: f.floor,
        roomNo: f.roomNo,
        structure: f.structure,

        parkingGrade: f.parkingGrade,

        parkingType: f.parkingType,
        totalParkingSlots: (f as any).totalParkingSlots,
        completionDate: effectiveCompletionDate,
        salePrice: f.salePrice,

        baseAreaSet: strictBase,
        extraAreaSets: strictExtras,

        elevator: f.elevator,
        slopeGrade: f.slopeGrade,
        structureGrade: f.structureGrade,

        totalBuildings: f.totalBuildings,
        totalFloors: f.totalFloors,
        totalHouseholds: f.totalHouseholds,
        remainingHouseholds: f.remainingHouseholds,

        buildingType: (f as any).buildingType ?? null,
        registrationTypeId: (f as any).registrationTypeId ?? null,
        parkingTypeId: (f as any).parkingTypeId ?? null,

        options: f.options,
        etcChecked: f.etcChecked,
        optionEtc: f.optionEtc,
        publicMemo: f.publicMemo,
        secretMemo: f.secretMemo,

        aspects: f.aspects,
        unitLines: f.unitLines,

        imageFolders,
        fileItems,

        pinKind: f.pinKind,
        lat: latNum,
        lng: lngNum,
      });

      const reservationId = (f as any).reservationId as string | number | null;
      const explicitPinDraftId =
        pinDraftId != null
          ? pinDraftId
          : ((f as any).pinDraftId as string | number | null);

      const selected: string[] = Array.isArray(f.options) ? f.options : [];
      const has = (label: string) => selected.includes(label);
      const extraOptionsTextRaw = String(f.optionEtc ?? "").trim();
      const pinOptions = {
        hasAircon: has("에어컨"),
        hasFridge: has("냉장고"),
        hasWasher: has("세탁기"),
        hasDryer: has("건조기"),
        hasBidet: has("비데"),
        hasAirPurifier: has("공기순환기"),
        ...(extraOptionsTextRaw
          ? { extraOptionsText: extraOptionsTextRaw.slice(0, 255) }
          : {}),
      };

      const directions: string[] = Array.isArray((f as any).aspects)
        ? Array.from(
            new Set(
              (f as any).aspects
                .map((a: any) => (a?.dir ?? "").trim())
                .filter((d: string) => d.length > 0)
            )
          )
        : [];

      const sourceUnits: UnitLine[] = Array.isArray((f as any).unitLines)
        ? (f as any).unitLines
        : Array.isArray((f as any).units)
        ? (f as any).units
        : [];

      const unitsDto =
        sourceUnits.length > 0
          ? sourceUnits.map((unit: UnitLine) => ({
              rooms: ((): number | null => {
                const v = (unit as any)?.rooms;
                if (v === "" || v == null) return null;
                const n = Number(v);
                return Number.isFinite(n) ? Math.trunc(n) : null;
              })(),
              baths: ((): number | null => {
                const v = (unit as any)?.baths;
                if (v === "" || v == null) return null;
                const n = Number(v);
                return Number.isFinite(n) ? Math.trunc(n) : null;
              })(),
              hasLoft: !!(unit as any)?.duplex,
              hasTerrace: !!(unit as any)?.terrace,
              minPrice: ((): number | null => {
                const v = (unit as any)?.primary;
                if (v === "" || v == null) return null;
                const n = Number(v);
                return Number.isFinite(n) ? Math.trunc(n) : null;
              })(),
              maxPrice: ((): number | null => {
                const v = (unit as any)?.secondary;
                if (v === "" || v == null) return null;
                const n = Number(v);
                return Number.isFinite(n) ? Math.trunc(n) : null;
              })(),
            }))
          : [];

      const isOld = toBoolUndef((f as any).isOld ?? (f as any).is_old);
      const isNew = toBoolUndef((f as any).isNew ?? (f as any).is_new);

      const pinDto: CreatePinDto = {
        lat: latNum,
        lng: lngNum,
        parkingGrade: f.parkingGrade || undefined,
        addressLine: f.address ?? "",
        name: f.title ?? "임시 매물",
        contactMainPhone: (f.officePhone ?? "").trim(),
        contactSubPhone: (f.officePhone2 ?? "").trim()
          ? (f.officePhone2 ?? "").trim()
          : undefined,
        completionDate: effectiveCompletionDate,
        buildingType: (f as any).buildingType ?? null,
        totalHouseholds: ((): number | null => {
          const s = String(f.totalHouseholds ?? "").trim();
          if (!s) return null;
          const n = Number(s);
          return Number.isFinite(n) ? n : null;
        })(),
        totalBuildings: ((): number | null => {
          const s = String(f.totalBuildings ?? "").trim();
          if (!s) return null;
          const n = Number(s);
          return Number.isFinite(n) ? n : null;
        })(),
        totalFloors: ((): number | null => {
          const s = String(f.totalFloors ?? "").trim();
          if (!s) return null;
          const n = Number(s);
          return Number.isFinite(n) ? n : null;
        })(),
        remainingHouseholds: ((): number | null => {
          const s = String(f.remainingHouseholds ?? "").trim();
          if (!s) return null;
          const n = Number(s);
          return Number.isFinite(n) ? Math.trunc(n) : null;
        })(),
        registrationTypeId: ((): number | null => {
          const s = String((f as any).registrationTypeId ?? "").trim();
          if (!s) return null;
          const n = Number(s);
          return Number.isFinite(n) ? Math.trunc(n) : null;
        })(),
        parkingTypeId: ((): number | null => {
          const s = String((f as any).parkingTypeId ?? "").trim();
          if (!s) return null;
          const n = Number(s);
          return Number.isFinite(n) ? Math.trunc(n) : null;
        })(),
        slopeGrade: f.slopeGrade ?? null,
        structureGrade: f.structureGrade ?? null,
        badge: (effectiveBadge as any) ?? null,
        publicMemo: f.publicMemo ?? null,
        privateMemo: f.secretMemo ?? null,
        hasElevator: f.elevator === "O",
        totalParkingSlots: ((): number | null => {
          const v = (f as any).totalParkingSlots;
          if (v === "" || v == null) return null;
          const n = Number(v);
          return Number.isFinite(n) ? Math.trunc(n) : null;
        })(),
        options: pinOptions,
        directions,
        minRealMoveInCost: ((): number | null => {
          const v = f.salePrice;
          if (v === "" || v == null) return null;
          const n = Number(v);
          return Number.isFinite(n) ? Math.trunc(n) : null;
        })(),
        ...(areaGroups && areaGroups.length > 0 ? { areaGroups } : {}),
        ...(explicitPinDraftId != null && {
          pinDraftId: String(explicitPinDraftId),
        }),
        ...(unitsDto.length > 0 ? { units: unitsDto } : {}),
        ...(isOld !== undefined ? { isOld } : {}),
        ...(isNew !== undefined ? { isNew } : {}),
      } as any;

      const { id: pinId, matchedDraftId } = await createPin(pinDto);

      try {
        for (let i = 0; i < (imageFolders as any[]).length; i++) {
          await persistOneCard(pinId, i);
        }
        await persistVerticalFiles(pinId);
      } catch (mediaErr) {
        console.warn("[PropertyCreate] media persist failed:", mediaErr);
      }

      try {
        if (reservationId != null) {
          await api.delete(`/survey-reservations/${reservationId}`);
          removeReservation?.(String(reservationId));
        } else if ((explicitPinDraftId ?? matchedDraftId) != null) {
          const pinDraftId = explicitPinDraftId ?? matchedDraftId;
          const listRes = await api.get("/survey-reservations/scheduled");
          const arr = Array.isArray(listRes.data?.data)
            ? listRes.data.data
            : Array.isArray(listRes.data)
            ? listRes.data
            : [];
          const target = arr.find(
            (r: any) =>
              String(r?.pin_draft_id) === String(pinDraftId) ||
              String(r?.pin?.draftId) === String(pinDraftId)
          );
          if (target?.id != null) {
            await api.delete(`/survey-reservations/${target.id}`);
            removeReservation?.(String(target.id));
          }
        }
      } catch (err: any) {
        const st = err?.response?.status;
        if (st !== 404 && st !== 403) {
          console.warn("reservation cleanup failed:", err);
        }
      }

      if (explicitPinDraftId != null) {
        removeDraft?.(String(explicitPinDraftId));
      }

      await Promise.resolve(
        onSubmit?.({
          pinId: String(pinId),
          matchedDraftId: explicitPinDraftId ?? matchedDraftId ?? null,
          lat: latNum,
          lng: lngNum,
          payload,
        } as any)
      );

      if (!asInner) {
        onClose?.();
      }
    } catch (e) {
      console.error("[PropertyCreate] save error:", e);
      const msg =
        (e as any)?.responseData?.messages?.join("\n") ||
        (e as any)?.message ||
        "저장 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.";
      alert(msg);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [
    f,
    imageFolders,
    fileItems,
    groups,
    onSubmit,
    onClose,
    initialLat,
    initialLng,
    persistOneCard,
    persistVerticalFiles,
    removeReservation,
    removeDraft,
    pinDraftId,
    asInner,
    findGroupById,
  ]);

  const imagesProp = useMemo(
    () => ({
      imageFolders,
      fileItems,
      registerImageInput: registerImageInputCompat,
      openImagePicker: stable_openImagePicker,
      onPickFilesToFolder: stable_onPickFilesToFolder,
      addPhotoFolder: stable_addPhotoFolder,
      removePhotoFolder: stable_removePhotoFolder,
      onChangeImageCaption: stable_onChangeImageCaption,
      handleRemoveImage: stable_handleRemoveImage,
      onAddFiles: stable_onAddFiles,
      onChangeFileItemCaption: stable_onChangeFileItemCaption,
      handleRemoveFileItem: stable_handleRemoveFileItem,
      maxFiles: MAX_FILES,
      maxPerCard: MAX_PER_CARD,
      groups,
      queueGroupTitle,
    }),
    [
      imageFolders,
      fileItems,
      registerImageInputCompat,
      stable_openImagePicker,
      stable_onPickFilesToFolder,
      stable_addPhotoFolder,
      stable_removePhotoFolder,
      stable_onChangeImageCaption,
      stable_handleRemoveImage,
      stable_onAddFiles,
      stable_onChangeFileItemCaption,
      stable_handleRemoveFileItem,
      groups,
      queueGroupTitle,
    ]
  );

  /* ====== 답사예정 핀일 때 저장 가능 조건 (매물명 + 분양사무실 전화번호만) ====== */
  const isVisitPlanPin = isVisitPlanPinKind((f as any).pinKind);
  const mainTitle = (f.title ?? "").trim();
  const mainOfficePhone = (f.officePhone ?? "").trim();

  // ✅ 버튼 활성화는 "비어있지 않음"만 체크
  const minimalForVisitPlan = !!mainTitle && !!mainOfficePhone;

  const canSave = isVisitPlanPin
    ? minimalForVisitPlan && !isSaving
    : f.isSaveEnabled && !isSaving;

  /* ================= 카드 내부 레이아웃 ================= */
  const content = (
    <>
      <HeaderContainer form={f} onClose={onClose} />

      {/* ⭐ 내부 스크롤 래퍼에 ref 연결 + 가로 스크롤 숨김 */}
      <div
        ref={scrollRef}
        className="
          flex-1 min-h-0
          overflow-y-auto overflow-x-hidden overscroll-y-contain
          px-4 py-4 md:px-5 md:py-4
          grid gap-4 md:gap-6
          grid-cols-1 md:grid-cols-[300px_1fr]
        "
      >
        <ImagesContainer images={imagesProp} />

        {/* 오른쪽 컬럼: 내용 넓이 제한용 min-w-0 */}
        <div className="space-y-6 min-w-0">
          <BasicInfoContainer form={f} />
          <NumbersContainer form={f} />
          <ParkingContainer form={parkingForm} />
          <CompletionRegistryContainer form={f} />
          <AspectsContainer form={f} />
          <AreaSetsContainer
            form={{
              baseAreaSet: toStrictAreaSet(f.baseAreaSet),
              setBaseAreaSet: (v: StrictAreaSet) => f.setBaseAreaSet(v),
              extraAreaSets: (Array.isArray(f.extraAreaSets)
                ? f.extraAreaSets
                : []
              ).map(toStrictAreaSet),
              setExtraAreaSets: (arr: StrictAreaSet[]) =>
                f.setExtraAreaSets(arr),
            }}
          />
          <StructureLinesContainer form={f} presets={STRUCTURE_PRESETS} />
          <OptionsContainer form={f} PRESET_OPTIONS={PRESET_OPTIONS} />
          <MemosContainer form={f} />
        </div>
      </div>

      <FooterButtons onClose={onClose} onSave={save} canSave={canSave} />
    </>
  );

  if (asInner) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        {content}
      </div>
    </div>
  );
}
