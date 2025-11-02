// src/features/properties/components/PropertyCreateModal/PropertyCreateModalBody.tsx
"use client";

import { useRef, useState, useCallback } from "react";

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

  const registerImageInputCompat: {
    (idx: number): (el: HTMLInputElement | null) => void;
    (idx: number, el: HTMLInputElement | null): void;
  } = ((idx: number, el?: HTMLInputElement | null) => {
    if (arguments.length === 1) {
      return (nextEl: HTMLInputElement | null) =>
        registerImageInputRaw(idx, nextEl);
    }
    return registerImageInputRaw(idx, el as HTMLInputElement | null);
  }) as any;

  const { removeByReservationId, removeByPinDraftId } =
    useScheduledReservations();

  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  // 숫자 → 정수 또는 null (""/undefined/null → null, 0 허용)
  const toIntOrNull = (v: any) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };

  // 숫자 → number 또는 undefined (빈문자/NaN은 undefined)
  const toNum = (v: any) => {
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

      // (참고) payload는 내부 상태/뷰 갱신용으로 유지
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
        salePrice: f.salePrice, // 내부 상태용

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
        unitLines: f.unitLines, // 내부 상태 유지 (전송용 아님)

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
        isDirectLease: has("직영임대") || has("직영 임대"),
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

      /** ✅ UnitLine(UI) → UnitsItemDto(API) 매핑
       *  - UI: rooms, baths, duplex, terrace, primary(min), secondary(max)
       *  - 상태 키는 `unitLines`가 표준. 혹시 모를 호환을 위해 `units`도 폴백.
       */
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

        // ✅ 연락처: 라벨 없이 폰만 전송
        contactMainPhone: (f.officePhone ?? "").trim() || "010-0000-0000",
        contactSubPhone:
          (f.officePhone2 ?? "").trim() !== ""
            ? (f.officePhone2 ?? "").trim()
            : undefined,

        completionDate: effectiveCompletionDate,
        buildingType: (f as any).buildingType ?? null,

        // ✅ 숫자 전송 (빈문자 제외, 0 허용)
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

        /** ✅ 최저 실입(정수 금액) */
        minRealMoveInCost: toIntOrNull(f.salePrice),

        ...(areaGroups && areaGroups.length > 0 ? { areaGroups } : {}),
        ...(explicitPinDraftId != null
          ? { pinDraftId: String(explicitPinDraftId) }
          : {}),

        // ✅ 서버 요구 스키마로 전송
        ...(unitsDto.length > 0 ? { units: unitsDto } : {}),
      } as any;

      const { id: pinId, matchedDraftId } = await createPin(pinDto);

      const pinDraftId = explicitPinDraftId ?? matchedDraftId;

      try {
        if (reservationId != null) {
          await api.delete(`/survey-reservations/${reservationId}`);
          removeByReservationId?.(String(reservationId));
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
            removeByReservationId?.(String(target.id));
          }
        }
      } catch (err: any) {
        const st = err?.response?.status;
        if (st !== 404 && st !== 403) {
          console.warn("reservation cleanup failed:", err);
        }
      }

      if (pinDraftId != null) {
        removeByPinDraftId?.(String(pinDraftId));
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
    removeByReservationId,
    removeByPinDraftId,
  ]);

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
          <ImagesContainer
            images={{
              imageFolders,
              fileItems,
              registerImageInput: registerImageInputCompat,
              openImagePicker,
              onPickFilesToFolder,
              addPhotoFolder,
              removePhotoFolder,
              onChangeImageCaption,
              handleRemoveImage,
              onAddFiles,
              onChangeFileItemCaption,
              handleRemoveFileItem,
              maxFiles: MAX_FILES,
              maxPerCard: MAX_PER_CARD,
            }}
          />

          <div className="space-y-6">
            <BasicInfoContainer form={f} />
            <NumbersContainer form={f} />
            <ParkingContainer form={f} />
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
