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

export default function PropertyCreateModalBody({
  onClose,
  onSubmit,
  initialAddress,
}: Omit<PropertyCreateModalProps, "open">) {
  // 모든 상태/액션
  const f = useCreateForm({ initialAddress });

  // 이미지 훅
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

  // 중복 저장 가드
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      if (!f.title.trim()) return;

      // 배지/날짜 계산 (YYYY-MM-DD)
      const badgeFromKind = mapPinKindToBadge(f.pinKind);
      const effectiveBadge = f.badge ?? badgeFromKind ?? undefined;
      const effectiveCompletionDate =
        typeof f.completionDate === "string" && f.completionDate.trim() !== ""
          ? f.completionDate
          : new Date().toISOString().slice(0, 10);

      // 매물 payload (부모로 전달)
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

        // 추가 필드
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
      });

      console.log(
        "[payload before send] buildingType=",
        (f as any).buildingType
      );

      // ✅ 서버 호출 없이 payload만 부모로 전달
      await Promise.resolve(onSubmit?.(payload));
      onClose?.();
    } catch (e) {
      console.error("[PropertyCreate] save error:", e);
      alert("저장 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [f, imageFolders, fileItems, onSubmit, onClose]);

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
