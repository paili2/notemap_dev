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
import { REGISTRY_LIST } from "@/features/properties/types/property-domain";

// UI 컨테이너
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

// ✅ /pins 호출 유틸과 api 클라이언트 임포트
import { api } from "@/shared/api/api";
import { createPin, CreatePinDto } from "@/shared/api/pins";
import { useScheduledReservations } from "@/features/survey-reservations/hooks/useScheduledReservations";

// ⛳️ areaGroups는 buildAreaGroups로 생성 (sanitizeAreaGroups 사용 X)
import { buildAreaGroups } from "@/features/properties/lib/area";

// 🔐 AreaSetsSection이 기대하는 엄격 타입
import type { AreaSet as StrictAreaSet } from "@/features/properties/components/sections/AreaSetsSection/types";
import { todayYmdKST } from "@/shared/date/todayYmdKST";

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
    registerImageInput,
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

  // ✅ 예약/드래프트 스토어 액션 (즉시 반영 핵심)
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

  // ⛑ 느슨한 AreaSet -> 엄격한 AreaSet 변환 (undefined를 빈 문자열로 보정)
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

      // 좌표는 반드시 외부에서 고정 주입된 값만 사용
      const latNum = Number(initialLat);
      const lngNum = Number(initialLng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        alert("좌표가 유효하지 않습니다. (initialLat/initialLng 미전달)");
        return;
      }

      const badgeFromKind = mapPinKindToBadge(f.pinKind);
      const effectiveBadge = f.badge ?? badgeFromKind ?? undefined;
      // KST YYYY-MM-DD로 통일 (서버/기존 코드와 일관)
      const effectiveCompletionDate =
        typeof f.completionDate === "string" && f.completionDate.trim() !== ""
          ? f.completionDate
          : todayYmdKST();

      // ✅ areaGroups: 엄격 변환 후 buildAreaGroups로 생성
      const strictBase = toStrictAreaSet(f.baseAreaSet);
      const strictExtras = (
        Array.isArray(f.extraAreaSets) ? f.extraAreaSets : []
      ).map(toStrictAreaSet);
      const areaGroups = buildAreaGroups(strictBase, strictExtras);

      // ✅ buildCreatePayload에도 totalParkingSlots 및 options 전달(프론트 보관용)
      //    ⛑ base/extra를 엄격 타입으로 변환해서 타입 에러 해결
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
        listingStars: f.listingStars,
        parkingType: f.parkingType,
        totalParkingSlots: toIntOrNull((f as any).totalParkingSlots),
        completionDate: effectiveCompletionDate,
        salePrice: f.salePrice,
        baseAreaSet: strictBase, // ← 변환값 사용
        extraAreaSets: strictExtras, // ← 변환값 사용
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

      // ✅ 드래프트/예약 정보 보존
      const reservationId = (f as any).reservationId;
      const explicitPinDraftId = (f as any).pinDraftId;

      // ✅ /pins 옵션 매핑 (선택 라벨 → boolean) + extraOptionsText
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

      // ✅ NEW: 향 -> directions 문자열 배열로 매핑
      const directions: string[] = Array.isArray((f as any).aspects)
        ? Array.from(
            new Set(
              (f as any).aspects
                .map((a: any) => (a?.dir ?? "").trim())
                .filter((d: string) => d.length > 0)
            )
          )
        : [];

      // ✅ /pins DTO로 매핑
      const pinDto: CreatePinDto = {
        lat: latNum,
        lng: lngNum,
        addressLine: f.address ?? "",
        name: f.title ?? "임시 매물",
        contactMainLabel: (f.officeName ?? "").trim() || "대표",
        contactMainPhone: (f.officePhone ?? "").trim() || "010-0000-0000",
        completionDate: effectiveCompletionDate, // YYYY-MM-DD
        buildingType: (f as any).buildingType ?? null,
        totalHouseholds: toNum(f.totalHouseholds) ?? null,
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

        // 🔥 areaGroups는 length 체크 후 확실히 포함
        ...(areaGroups && areaGroups.length > 0 ? { areaGroups } : {}),

        ...(explicitPinDraftId != null
          ? { pinDraftId: String(explicitPinDraftId) }
          : {}),
      } as any;

      // ✅ 핀 생성 (/pins)
      const { id: pinId, matchedDraftId /*, lat, lng*/ } = await createPin(
        pinDto
      );

      // ✅ 예약 정리(서버) + 스토어 즉시 반영(로컬)
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

      // 🔥 드래프트 제거 즉시 반영
      if (pinDraftId != null) {
        removeByPinDraftId?.(String(pinDraftId));
      }

      // ✅ 부모에 결과 전달
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

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min_h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <ImagesContainer
            images={{
              imageFolders,
              fileItems,
              registerImageInput,
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
            <CompletionRegistryContainer
              form={f}
              REGISTRY_LIST={REGISTRY_LIST}
            />
            <AspectsContainer form={f} />
            {/* ⛑ AreaSetsContainer에 엄격 타입으로 어댑팅해서 전달 */}
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
