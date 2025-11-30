"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";

import type { PropertyCreateModalProps } from "./types";

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

import { createPin, createPinDraft, CreatePinDto } from "@/shared/api/pins";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";

import type { AreaSet as StrictAreaSet } from "@/features/properties/components/sections/AreaSetsSection/types";
import type { UnitLine } from "@/features/properties/types/property-domain";
import type { PinKind } from "@/features/pins/types";

/* ───────────── 미디어 영속화 단계 API ───────────── */
import { createPhotoGroup } from "@/shared/api/photoGroups";
import { uploadPhotosAndGetUrls } from "@/shared/api/photoUpload";
import { createPhotosInGroup } from "@/shared/api/photos";
import type { ImageItem } from "@/features/properties/types/media";
import { mapPinKindToBadge } from "@/features/properties/lib/badge";
import {
  MAX_FILES,
  MAX_PER_CARD,
  PRESET_OPTIONS,
  STRUCTURE_PRESETS,
} from "../../constants";
import FooterButtons from "../../sections/FooterButtons/FooterButtons";

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

/** ✅ 실제 답사예정 핀 kind 값: PinKind 중 "question" 을 사용 */
const VISIT_PLAN_PIN_KIND: PinKind = "question";

/** pinKind 값이 '답사예정핀'인지 판별 */
const isVisitPlanPinKind = (pinKind: any): boolean =>
  String(pinKind) === VISIT_PLAN_PIN_KIND;

/** ✅ asInner: true면 카드 안 내용만 렌더(딤/포털 없음) */
type Props = Omit<PropertyCreateModalProps, "open"> & {
  asInner?: boolean;
  /** 상위에서 내려주는 기본 핀종류 (없으면 그대로 둠) */
  initialPinKind?: PinKind | null;

  /** 임시핀에서 가져온 헤더 프리필 (매물명 / 분양사무실 전화번호) */
  draftHeaderPrefill?: {
    title?: string;
    officePhone?: string;
  } | null;
};

export default function PropertyCreateModalBody({
  onClose,
  onSubmit,
  initialAddress,
  initialLat,
  initialLng,
  pinDraftId,
  asInner,
  initialPinKind,
  draftHeaderPrefill,
}: Props) {
  console.debug("[PropertyCreateModalBody props]", { draftHeaderPrefill });

  const f = useCreateForm({ initialAddress, pinDraftId, draftHeaderPrefill });

  /** 🔍 이 모달이 '답사예정 전용 모드'인지 여부 */
  const isVisitPlanPin = !pinDraftId && isVisitPlanPinKind(initialPinKind);

  console.log("[PropertyCreateModalBody] initialPinKind =", initialPinKind);
  console.log("[PropertyCreateModalBody] isVisitPlanPin =", isVisitPlanPin);
  console.log(
    "[PropertyCreateModalBody] form.pinKind BEFORE init =",
    (f as any).pinKind
  );

  // ✅ 최초 마운트 시 pinKind 초기값 설정
  const didInitPinKindRef = useRef(false);
  useEffect(() => {
    if (didInitPinKindRef.current) return;

    const setPinKind = (f as any).setPinKind as
      | ((kind: PinKind) => void)
      | undefined;
    if (typeof setPinKind !== "function") return;

    const anyForm = f as any;
    const currentKind = anyForm.pinKind as PinKind | null | undefined;

    const targetKind: PinKind =
      (initialPinKind as PinKind | null | undefined) ??
      currentKind ??
      ("1room" as PinKind);

    setPinKind(targetKind);
    didInitPinKindRef.current = true;
  }, [f, initialPinKind]);

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
    groups,
    queueGroupTitle,
  } = usePropertyImages();

  /** ✅ 제목 + 사진이 있는 가로 폴더가 최소 1개라도 있는지 */
  const hasImageFolderWithTitle = useMemo(() => {
    const folders = imageFolders as any[];

    return folders.some((folder, idx) => {
      const hasImage = Array.isArray(folder) && folder.length > 0;
      if (!hasImage) return false;

      const titleFromMeta =
        groups.find((g) => g.id === `folder-${idx}`)?.title ?? "";
      return titleFromMeta.trim().length > 0;
    });
  }, [imageFolders, groups]);

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
  const { removeByPinDraftId: removeDraft } = useScheduledReservations();

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
      const label = (u?.label ?? u?.name ?? `${i + 1}번째 구조`).toString();

      // 🔹 최소/최대 하나라도 비어 있으면 에러
      if (min == null || max == null) {
        return `${label}: 최소·최대 매매가를 모두 입력해 주세요.`;
      }

      if (min === 0 || max === 0) {
        return `${label}: 0원은 입력할 수 없습니다.`;
      }

      if (max <= min) {
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

      console.log("[persistOneCard] run", { folderIdx, groupImages });

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

      console.log("[persistVerticalFiles] run", { fileItems });

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

  /* ====== 답사예정 핀 여부 & 최소 저장 조건 ====== */
  const rawPinKind = (f as any).pinKind as PinKind | null | undefined;

  const mainTitle = (f.title ?? "").trim();
  const mainOfficePhone = (f.officePhone ?? "").trim();

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      console.log("[PropertyCreate] save clicked");

      if (!f.title.trim()) {
        alert("매물명을 입력해 주세요.");
        return;
      }

      const latNum = Number(initialLat);
      const lngNum = Number(initialLng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        alert("좌표가 유효하지 않습니다. (initialLat/initialLng 미전달)");
        return;
      }

      const rawPinKindLocal = (f as any).pinKind as PinKind | null | undefined;

      /* ====== 1) 답사예정핀 전용 분기 ====== */
      if (isVisitPlanPin) {
        if (!mainTitle) {
          alert("매물명을 입력해 주세요.");
          return;
        }
        if (!isValidPhoneKR(f.officePhone)) {
          alert("분양사무실 전화번호를 정확히 입력해 주세요.");
          return;
        }

        if (!rawPinKindLocal) {
          alert("핀 종류를 선택해 주세요.");
          return;
        }

        // addressLine 이 비어 있으면 매물명으로 대체
        const addressLine = (f.address && f.address.trim()) || mainTitle;

        // ✅ 공용 createPinDraft 사용 + name / contactMainPhone 같이 전송
        await createPinDraft({
          lat: latNum,
          lng: lngNum,
          addressLine,
          name: mainTitle,
          contactMainPhone: mainOfficePhone,
        });

        onClose?.();
        return;
      }

      /* ====== 2) 일반핀 저장(createPin) 로직 ====== */

      if (!isVisitPlanPin && !hasImageFolderWithTitle) {
        alert("사진 폴더 제목과 사진을 최소 1개 이상 등록해 주세요.");
        return;
      }

      if (!rawPinKindLocal) {
        alert("핀 종류를 선택해 주세요.");
        return;
      }

      if (!f.isSaveEnabled) {
        alert("필수 항목을 확인해 주세요.");
        return;
      }

      const priceError = validateUnitPriceRanges(f.unitLines as any[]);
      if (priceError) {
        alert(priceError);
        return;
      }

      const areaError = validateAreaSets();
      if (areaError) {
        alert(areaError);
        return;
      }

      const rawCompletion = normalizeDateInput(f.completionDate);
      const normalizedCompletion =
        rawCompletion && rawCompletion.length >= 10
          ? rawCompletion.slice(0, 10)
          : rawCompletion;

      if (normalizedCompletion && !isValidIsoDateStrict(normalizedCompletion)) {
        alert("준공일은 YYYY-MM-DD 형식으로 입력해 주세요.");
        return;
      }

      /* ========= 최저 실입 / 리베이트 값 수집 ========= */
      const anyForm = f as any;

      // ✅ 최저 실입(만원 단위)
      const rawMinRealMoveInCost =
        anyForm.minRealMoveInCost ??
        anyForm.minRealMoveInCostText ??
        anyForm.minRealMoveInCostRaw ??
        null;

      const minRealMoveInCost = numOrNull(rawMinRealMoveInCost);

      // ✅ 리베이트: 헤더 R 인풋의 원본 텍스트(rebateRaw)만 사용
      const rawRebate = String(anyForm.rebateRaw ?? "").trim();
      const rebateNumeric = rawRebate.replace(/[^\d]/g, "");
      const rebateText: string | null = rebateNumeric
        ? rebateNumeric.slice(0, 50)
        : null;

      // ✅ 신축/구옥 선택 여부: buildingGrade 또는 isNew/isOld 둘 중 아무거나
      const hasBuildingGrade =
        anyForm.buildingGrade != null ||
        anyForm.isNew === true ||
        anyForm.isOld === true;

      console.log("[save] rawMinRealMoveInCost =", rawMinRealMoveInCost);
      console.log("[save] minRealMoveInCost =", minRealMoveInCost);
      console.log("[save] rebateText =", rebateText);
      console.log("[save] hasBuildingGrade =", hasBuildingGrade);

      if (!hasBuildingGrade) {
        alert("신축/구옥을 선택해 주세요.");
        return;
      }
      if (anyForm.elevator !== "O" && anyForm.elevator !== "X") {
        alert("엘리베이터 유무를 선택해 주세요.");
        return;
      }
      if (!rebateText) {
        alert("리베이트를 입력해 주세요.");
        return;
      }

      // ✅ badge: 직접 입력이 없으면 핀 종류 기반 기본값 사용
      const effectiveBadge =
        (f.badge ?? "").trim() ||
        (rawPinKindLocal ? mapPinKindToBadge(rawPinKindLocal) : "") ||
        undefined;

      const payload = buildCreatePayload({
        title: f.title,
        address: f.address,
        officeName: f.officeName,
        officePhone: f.officePhone,
        officePhone2: f.officePhone2,
        moveIn: f.moveIn,
        floor: f.floor,
        roomNo: f.roomNo,
        structure: f.structure,

        badge: effectiveBadge ?? null,

        parkingGrade: f.parkingGrade,
        parkingType: f.parkingType ?? null,
        totalParkingSlots: f.totalParkingSlots,

        completionDate: normalizedCompletion,
        salePrice: f.salePrice,

        minRealMoveInCost,
        rebateText,

        baseAreaSet: f.baseAreaSet,
        extraAreaSets: Array.isArray(f.extraAreaSets) ? f.extraAreaSets : [],

        elevator: f.elevator,
        registryOne: f.registryOne,
        slopeGrade: f.slopeGrade,
        structureGrade: f.structureGrade,

        totalBuildings: f.totalBuildings,
        totalFloors: f.totalFloors,
        totalHouseholds: f.totalHouseholds,
        remainingHouseholds: f.remainingHouseholds,

        buildingType: (f as any).buildingType ?? null,
        registrationTypeId: (f as any).registrationTypeId ?? null,

        options: f.options,
        etcChecked: f.etcChecked,
        optionEtc: f.optionEtc,
        publicMemo: f.publicMemo,
        secretMemo: f.secretMemo,

        aspects: f.aspects,
        unitLines: f.unitLines as UnitLine[],

        imageFolders,
        fileItems,

        pinKind: rawPinKindLocal,
        lat: latNum,
        lng: lngNum,

        pinDraftId,
      });

      console.log("[PropertyCreate] payload →", payload);

      // ✅ dto에선 rebate 필드 제거 (백엔드는 rebateText만 받음)
      const { rebate: _ignoredRebate, ...payloadWithoutRebate } =
        payload as any;

      const dto: CreatePinDto = {
        ...(payloadWithoutRebate as any),

        // 좌표 & 주소
        lat: latNum,
        lng: lngNum,
        addressLine: f.address ?? null,

        // 매물명
        name: f.title.trim(),

        // 메모
        publicMemo: f.publicMemo ?? null,
        privateMemo: f.secretMemo ?? null,

        // 최저 실입
        minRealMoveInCost,

        // ✅ 리베이트 텍스트
        rebateText,

        // 안전하게 다시 명시
        pinKind: rawPinKindLocal,
        pinDraftId,
      } as any;

      const createdPin = await createPin(dto);
      const createdData = (createdPin as any)?.data ?? createdPin;
      const pinId =
        createdData?.id ?? createdData?.pinId ?? createdData?.pin_id ?? null;

      if (pinId != null) {
        for (let i = 0; i < (imageFolders as any[]).length; i++) {
          await persistOneCard(pinId, i);
        }
        if (fileItems.length > 0) {
          await persistVerticalFiles(pinId);
        }
      }

      if (pinDraftId != null) {
        removeDraft(pinDraftId);
      }

      // ✅ PropertyCreateResult 타입에 맞게 전달
      await Promise.resolve(
        onSubmit?.({
          pinId: String(pinId),
          matchedDraftId: pinDraftId ?? null,
          lat: latNum,
          lng: lngNum,
          payload,
        } as any)
      );

      onClose?.();
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
    onSubmit,
    onClose,
    initialLat,
    initialLng,
    persistOneCard,
    persistVerticalFiles,
    removeDraft,
    pinDraftId,
    isVisitPlanPin,
    mainTitle,
    mainOfficePhone,
    hasImageFolderWithTitle,
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

  /* ====== 답사예정 핀일 때 저장 가능 조건 ====== */
  const minimalForVisitPlan = !!mainTitle && !!mainOfficePhone;

  const anyFormForCanSave = f as any;

  // ✅ 신축/구옥 선택 여부
  const hasBuildingGradeForCanSave =
    anyFormForCanSave.buildingGrade != null ||
    anyFormForCanSave.isNew === true ||
    anyFormForCanSave.isOld === true;

  // ✅ 엘리베이터 선택 여부
  const elevatorSelected =
    anyFormForCanSave.elevator === "O" || anyFormForCanSave.elevator === "X";

  // ✅ 리베이트 인풋이 채워졌는지 (rebateRaw 기준, 숫자만 추출)
  const rawRebateForCanSave = String(
    (anyFormForCanSave as any).rebateRaw ?? ""
  ).trim();
  const rebateFilled = rawRebateForCanSave.replace(/[^\d]/g, "").length > 0;

  // 🔹 구조별 최소/최대 매매가도 canSave 조건에 포함
  const unitLinesPriceError = validateUnitPriceRanges(
    Array.isArray((f as any).unitLines) ? ((f as any).unitLines as any[]) : []
  );

  // 🔹 버튼 활성에 필요한 추가 필수들
  const extraRequiredFilled =
    hasBuildingGradeForCanSave && elevatorSelected && rebateFilled;

  console.log("[canSave]", {
    rawIsSaveEnabled: f.isSaveEnabled,
    hasBuildingGradeForCanSave,
    elevatorSelected,
    rebateFilled,
    unitLinesPriceError,
    isVisitPlanPin,
    minimalForVisitPlan,
    hasImageFolderWithTitle,
  });

  const canSave = isVisitPlanPin
    ? minimalForVisitPlan && !isSaving
    : f.isSaveEnabled &&
      extraRequiredFilled &&
      !unitLinesPriceError &&
      hasImageFolderWithTitle &&
      !isSaving;

  /** ✅ 일반핀 → 답사예정핀으로 전환될 때, 비활성화되는 필드 값 초기화 */
  const prevIsVisitPlanRef = useRef(isVisitPlanPin);
  useEffect(() => {
    const prev = prevIsVisitPlanRef.current;

    if (isVisitPlanPin && prev === false) {
      const anyForm = f as any;

      anyForm.setBuildingGrade?.(null);
      anyForm.setParkingGrade?.("");
      anyForm.setSlopeGrade?.("");
      anyForm.setStructureGrade?.("");

      anyForm.setBuildingType?.(null);
      anyForm.buildingType = null;

      anyForm.setCompletionDate?.("");
      anyForm.completionDate = "";

      if (typeof anyForm.setSalePrice === "function") {
        anyForm.setSalePrice(null);
      } else {
        anyForm.salePrice = null;
      }

      anyForm.setTotalBuildings?.("");
      anyForm.setTotalFloors?.("");
      anyForm.setTotalHouseholds?.("");
      anyForm.setRemainingHouseholds?.("");

      anyForm.setTotalParkingSlots?.(null);
      anyForm.setParkingType?.("");

      anyForm.setElevator?.(null);

      const emptyArea: StrictAreaSet = {
        title: "",
        exMinM2: "",
        exMaxM2: "",
        exMinPy: "",
        exMaxPy: "",
        realMinM2: "",
        realMaxM2: "",
        realMinPy: "",
        realMaxPy: "",
      };
      anyForm.setBaseAreaSet?.(emptyArea);
      anyForm.setExtraAreaSets?.([]);

      if (typeof anyForm.setUnitLines === "function") {
        anyForm.setUnitLines([]);
      } else {
        anyForm.unitLines = [];
      }

      anyForm.setAspects?.([]);

      anyForm.setOptions?.([]);
      anyForm.setEtcChecked?.(false);
      anyForm.setOptionEtc?.("");
      anyForm.setPublicMemo?.("");
      anyForm.setSecretMemo?.("");
    }

    prevIsVisitPlanRef.current = isVisitPlanPin;
  }, [isVisitPlanPin, f]);

  /* ================= 카드 내부 레이아웃 ================= */
  const content = (
    <>
      <HeaderContainer
        form={f}
        onClose={onClose}
        isVisitPlanPin={isVisitPlanPin}
      />

      <div
        ref={scrollRef}
        className="
          flex-1 min-h-0
          overflow-y-auto overflow-x-hidden overscroll-y-contain
          px-4 py-4 md:px-5 md:py-4
        "
      >
        <div
          className="
            grid gap-4 md:gap-6
            grid-cols-1 md:grid-cols-[300px_1fr]
          "
        >
          <fieldset
            disabled={isVisitPlanPin}
            className={isVisitPlanPin ? "opacity-60" : ""}
          >
            <ImagesContainer images={imagesProp} />
          </fieldset>

          <div className="space-y-6 min-w-0">
            <BasicInfoContainer form={f} />

            <fieldset
              disabled={isVisitPlanPin}
              className={isVisitPlanPin ? "opacity-60" : ""}
            >
              <div className="space-y-6">
                <NumbersContainer form={f} />
                <ParkingContainer form={parkingForm} />
                <CompletionRegistryContainer
                  form={f}
                  isVisitPlanPin={isVisitPlanPin}
                />
                <AspectsContainer form={f} isVisitPlanPin={isVisitPlanPin} />
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
                <StructureLinesContainer
                  form={f}
                  presets={STRUCTURE_PRESETS}
                  isVisitPlanPin={isVisitPlanPin}
                />
                <OptionsContainer form={f} PRESET_OPTIONS={PRESET_OPTIONS} />
                <MemosContainer form={f} />
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <FooterButtons onClose={onClose} onSave={save} canSave={canSave} />
    </>
  );

  if (asInner) return content;

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
