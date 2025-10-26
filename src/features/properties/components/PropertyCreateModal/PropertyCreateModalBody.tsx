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

// ✅ 예약/드래프트 스토어: 즉시 반영용

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
  const {
    removeByReservationId,
    removeByPinDraftId,
    // 필요하면 .refetch 도 노출해서 사용 가능
  } = useScheduledReservations();

  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

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
      const effectiveCompletionDate =
        typeof f.completionDate === "string" && f.completionDate.trim() !== ""
          ? f.completionDate
          : new Date().toISOString().slice(0, 10);

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
        parkingCount: f.parkingCount,
        completionDate: effectiveCompletionDate,
        salePrice: f.salePrice,
        baseAreaSet: f.baseAreaSet,
        extraAreaSets: f.extraAreaSets,
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

      const toNum = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      // ✅ 드래프트/예약 정보 보존
      const reservationId = (f as any).reservationId;
      const explicitPinDraftId = (f as any).pinDraftId;

      // ✅ /pins DTO로 매핑 (+ pinDraftId 함께 전달 — 백엔드가 정확히 비활성화하도록)
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
        // 🔥 추가: 백엔드 create(dto)에서 pinDraftId를 우선 매칭하도록
        // (백이 아직 필드를 안 받는다면 타입 확장 또는 any 캐스팅으로 임시 전송 가능)
        ...(explicitPinDraftId != null
          ? { pinDraftId: String(explicitPinDraftId) }
          : {}),
      } as any;

      // ✅ 핀 생성 (/pins)
      //    백엔드가 응답에 { id, matchedDraftId, (선택) lat, lng }를 내려주는게 베스트
      const { id: pinId, matchedDraftId /*, lat, lng*/ } = await createPin(
        pinDto
      );

      // ✅ 예약 정리(서버) + 스토어 즉시 반영(로컬)
      const pinDraftId = explicitPinDraftId ?? matchedDraftId;

      try {
        if (reservationId != null) {
          await api.delete(`/survey-reservations/${reservationId}`);
          // 🔥 로컬 스토어 즉시 반영
          removeByReservationId?.(String(reservationId));
        } else if (pinDraftId != null) {
          // 서버 정리
          // (예약 id를 모르면 목록에서 찾아 삭제)
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
            // 🔥 로컬 스토어 즉시 반영
            removeByReservationId?.(String(target.id));
          }
        }
      } catch (err: any) {
        const st = err?.response?.status;
        if (st !== 404 && st !== 403) {
          console.warn("reservation cleanup failed:", err);
        }
      }

      // 🔥 드래프트 기반 분기/메뉴 즉시 변경: 스토어에서 드래프트 제거
      if (pinDraftId != null) {
        removeByPinDraftId?.(String(pinDraftId));
      }

      // ✅ 부모에 결과 전달 (부모가 맵 레이어 스토어를 쓰면 여기서도 바로 패치 가능)
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
            <AreaSetsContainer form={f} />
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
