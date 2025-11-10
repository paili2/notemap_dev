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

/* ───────────── 미디어 영속화 단계 API ───────────── */
import { createPhotoGroup } from "@/shared/api/photoGroups";
import { uploadPhotosAndGetUrls } from "@/shared/api/photoUpload";
import { createPhotosInGroup } from "@/shared/api/photos";
import type { ImageItem } from "@/features/properties/types/media";

export default function PropertyCreateModalBody({
  onClose,
  onSubmit,
  initialAddress,
  initialLat,
  initialLng,
}: Omit<PropertyCreateModalProps, "open">) {
  const f = useCreateForm({ initialAddress });

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

  // 예약/드래프트 정리 함수는 한 번만 구조분해(별칭)
  const {
    removeByReservationId: removeReservation,
    removeByPinDraftId: removeDraft,
  } = useScheduledReservations();

  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const toIntOrNull = (v: unknown) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };

  const toNum = (v: unknown) => {
    const s = String(v ?? "").trim();
    if (s === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
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

  /** 카드 하나: 업로드 → urls 있으면 그룹 생성(항상 title 포함) → /photos 등록 */
  const persistOneCard = useCallback(
    async (pinId: string | number, folderIdx: number) => {
      if (processedCardSetRef.current.has(folderIdx)) return;
      processedCardSetRef.current.add(folderIdx);

      const groupImages = imageFolders[folderIdx] ?? [];
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
          title: `카드 ${folderIdx + 1}`,
          sortOrder: folderIdx,
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
    [imageFolders, imageItemToFile]
  );

  /** 세로 파일: 업로드 → urls 있으면 그룹 생성(항상 title 포함) → /photos 등록 */
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

        const group = await createPhotoGroup({
          pinId,
          title: "세로 파일",
          sortOrder: imageFolders?.length ?? 0,
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
    [fileItems, imageFolders?.length, imageItemToFile]
  );

  /* ── ParkingContainer 어댑터 ── */
  const parkingForm = useMemo(
    () => ({
      parkingType: f.parkingType ?? null,
      setParkingType: (v: string | null) => f.setParkingType(v ?? ""),

      // f.totalParkingSlots (number|null) -> string|null 로 내려줌
      totalParkingSlots:
        f.totalParkingSlots == null ? null : String(f.totalParkingSlots),

      // ⬇️ string|null -> number|null 로 변환해서 내부 상태에 저장
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

      const badgeFromKind = mapPinKindToBadge(f.pinKind);
      const effectiveBadge = f.badge ?? badgeFromKind ?? undefined;
      const effectiveCompletionDate =
        typeof f.completionDate === "string" && f.completionDate.trim() !== ""
          ? f.completionDate
          : todayYmdKST();

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
        totalParkingSlots: toIntOrNull((f as any).totalParkingSlots),
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

      const reservationId = (f as any).reservationId;
      const explicitPinDraftId = (f as any).pinDraftId;

      const selected: string[] = Array.isArray(f.options) ? f.options : [];
      const has = (label: string) => selected.includes(label);
      const extraOptionsTextRaw = String(f.optionEtc ?? "").trim();
      const pinOptions = {
        hasAircon: has("에어컨"),
        hasFridge: has("냉장고"),
        hasWasher: has("세탁기"),
        hasDryer: has("건조기"),
        hasBidet: has("비데"),
        hasAirPurifier: has("공기청정기") || has("공기순환기"),
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
              rooms: toIntOrNull((unit as any)?.rooms),
              baths: toIntOrNull((unit as any)?.baths),
              hasLoft: !!(unit as any)?.duplex,
              hasTerrace: !!(unit as any)?.terrace,
              minPrice: toIntOrNull((unit as any)?.primary),
              maxPrice: toIntOrNull((unit as any)?.secondary),
            }))
          : [];

      const pinDto: CreatePinDto = {
        lat: latNum,
        lng: lngNum,
        parkingGrade: f.parkingGrade || undefined,
        addressLine: f.address ?? "",
        name: f.title ?? "임시 매물",
        contactMainPhone: (f.officePhone ?? "").trim() || "010-0000-0000",
        contactSubPhone:
          (f.officePhone2 ?? "").trim() !== ""
            ? (f.officePhone2 ?? "").trim()
            : undefined,
        completionDate: effectiveCompletionDate,
        buildingType: (f as any).buildingType ?? null,
        totalHouseholds: toNum(f.totalHouseholds) ?? null,
        totalBuildings: toNum(f.totalBuildings) ?? null,
        totalFloors: toNum(f.totalFloors) ?? null,
        remainingHouseholds: toNum(f.remainingHouseholds) ?? null,
        registrationTypeId: toNum((f as any).registrationTypeId) ?? null,
        parkingTypeId: toNum((f as any).parkingTypeId) ?? null,
        slopeGrade: f.slopeGrade ?? null,
        structureGrade: f.structureGrade ?? null,
        badge: (effectiveBadge as any) ?? null,
        publicMemo: f.publicMemo ?? null,
        privateMemo: f.secretMemo ?? null,
        hasElevator: f.elevator === "O",
        totalParkingSlots: toIntOrNull((f as any).totalParkingSlots),
        options: pinOptions,
        directions,
        minRealMoveInCost: toIntOrNull(f.salePrice),
        ...(areaGroups && areaGroups.length > 0 ? { areaGroups } : {}),
        ...(explicitPinDraftId != null
          ? { pinDraftId: String(explicitPinDraftId) }
          : {}),
        ...(unitsDto.length > 0 ? { units: unitsDto } : {}),
      } as any;

      // 1) 핀 생성
      const { id: pinId, matchedDraftId } = await createPin(pinDto);

      // 2) 사진/파일 영속화
      try {
        for (let i = 0; i < (imageFolders?.length ?? 0); i++) {
          await persistOneCard(pinId, i);
        }
        await persistVerticalFiles(pinId);
      } catch (mediaErr) {
        console.warn("[PropertyCreate] media persist failed:", mediaErr);
      }

      // 3) 예약/드래프트 정리
      const pinDraftId = explicitPinDraftId ?? matchedDraftId;
      try {
        if (reservationId != null) {
          await api.delete(`/survey-reservations/${reservationId}`);
          removeReservation?.(String(reservationId));
        } else if (pinDraftId != null) {
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

      if (pinDraftId != null) {
        removeDraft?.(String(pinDraftId));
      }

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
    removeReservation,
    removeDraft,
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
    ]
  );

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        <HeaderContainer form={f} onClose={onClose} />

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <ImagesContainer images={imagesProp} />

          <div className="space-y-6">
            <BasicInfoContainer form={f} />
            <NumbersContainer form={f} />

            {/* 🔹 string|null 계약으로 맞춘 어댑터 전달 */}
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

        <FooterButtons
          onClose={onClose}
          onSave={save}
          canSave={f.isSaveEnabled && !isSaving}
        />
      </div>
    </div>
  );
}
