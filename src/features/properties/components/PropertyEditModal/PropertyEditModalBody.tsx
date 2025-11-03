"use client";

import { ComponentProps, useMemo, useCallback } from "react";
import FooterButtons from "../sections/FooterButtons/FooterButtons";

import type { PropertyEditModalProps } from "./types";

import { useEditImages } from "./hooks/useEditImages";
import { useEditForm } from "./hooks/useEditForm/useEditForm";

import HeaderContainer from "./ui/HeaderContainer";
import BasicInfoContainer from "./ui/BasicInfoContainer";
import NumbersContainer from "./ui/NumbersContainer";
import ParkingContainer from "./ui/ParkingContainer";
import CompletionRegistryContainer from "./ui/CompletionRegistryContainer";
import AspectsContainer from "./ui/AspectsContainer";
import AreaSetsContainer from "./ui/AreaSetsContainer";
import StructureLinesContainer from "./ui/StructureLinesContainer";
import OptionsContainer from "./ui/OptionsContainer";
import MemosContainer from "./ui/MemosContainer";
import ImagesContainer from "./ui/ImagesContainer";
import { buildUpdatePayload } from "./lib/buildUpdatePayload";

type ParkingFormSlice = ComponentProps<typeof ParkingContainer>["form"];

export default function PropertyEditModalBody({
  onClose,
  onSubmit,
  initialData,
  embedded = false,
}: Omit<PropertyEditModalProps, "open"> & { embedded?: boolean }) {
  const propertyId = String((initialData as any)?.id ?? "");

  // 이미지 초기값
  const initialImages = useMemo(() => {
    if (!initialData) return null;
    const v = (initialData as any).view ?? (initialData as any);
    return {
      imageFolders: v?.imageFolders,
      imageCards: v?.imageCards,
      images: v?.images,
      imageCardCounts: v?.imageCardCounts,
      verticalImages: v?.verticalImages ?? v?.imagesVertical ?? v?.fileItems,
      imagesVertical: v?.imagesVertical,
      fileItems: v?.fileItems,
    };
  }, [initialData]);

  // 이미지 훅 (서버 연동 필드 포함)
  const {
    imageFolders,
    verticalImages,
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

    // ⬇️ 서버 상태/액션들 추가로 구조분해
    groups,
    photosByGroup,
    mediaLoading,
    mediaError,
    reloadGroups,
    uploadToGroup,
    createGroupAndUpload,
    makeCover,
    reorder,
    moveToGroup,
    deletePhotos,
  } = useEditImages({ propertyId, initial: initialImages });

  // ImagesContainer에 넘길 통합 prop (두 레이아웃에서 공통 사용)
  const imagesProp = useMemo(
    () => ({
      imageFolders,
      verticalImages,
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

      // 서버 상태/액션 모두 전달
      groups,
      photosByGroup,
      mediaLoading,
      mediaError,
      reloadGroups,
      uploadToGroup,
      createGroupAndUpload,
      makeCover,
      reorder,
      moveToGroup,
      deletePhotos,
    }),
    [
      imageFolders,
      verticalImages,
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
      groups,
      photosByGroup,
      mediaLoading,
      mediaError,
      reloadGroups,
      uploadToGroup,
      createGroupAndUpload,
      makeCover,
      reorder,
      moveToGroup,
      deletePhotos,
    ]
  );

  // 폼 훅
  const f = useEditForm({ initialData });

  // ✅ ParkingContainer 어댑터
  const parkingForm: ParkingFormSlice = useMemo(
    () => ({
      parkingType: f.parkingType || null,
      setParkingType: (v) => f.setParkingType(v ?? ""),
      totalParkingSlots:
        f.totalParkingSlots === "" ? null : String(f.totalParkingSlots),
      setTotalParkingSlots: (v) => f.setTotalParkingSlots(v ?? ""),
    }),
    [
      f.parkingType,
      f.totalParkingSlots,
      f.setParkingType,
      f.setTotalParkingSlots,
    ]
  );

  const isSaveEnabled = f.isSaveEnabled;

  const save = useCallback(async () => {
    if (!f.title.trim()) return;

    const { orientations, aspect, aspectNo, aspect1, aspect2, aspect3 } =
      f.buildOrientation();
    const {
      exclusiveArea,
      realArea,
      extraExclusiveAreas,
      extraRealAreas,
      baseAreaTitleOut,
      extraAreaTitlesOut,
    } = f.packAreas();

    const payload = buildUpdatePayload({
      title: f.title,
      address: f.address,
      officeName: f.officeName,
      officePhone: f.officePhone,
      officePhone2: f.officePhone2,
      moveIn: f.moveIn,
      floor: f.floor,
      roomNo: f.roomNo,
      structure: f.structure,

      parkingGrade: f.parkingGrade,
      parkingType: f.parkingType,
      totalParkingSlots: f.totalParkingSlots,
      completionDate: f.completionDate,
      salePrice: f.salePrice,

      baseAreaSet: f.baseAreaSet,
      extraAreaSets: f.extraAreaSets,
      exclusiveArea,
      realArea,
      extraExclusiveAreas,
      extraRealAreas,
      baseAreaTitleOut,
      extraAreaTitlesOut,

      elevator: f.elevator,
      registryOne: f.registry,
      slopeGrade: f.slopeGrade,
      structureGrade: f.structureGrade,

      totalBuildings: f.totalBuildings,
      totalFloors: f.totalFloors,
      totalHouseholds: f.totalHouseholds,
      remainingHouseholds: f.remainingHouseholds,

      options: f.options,
      etcChecked: f.etcChecked,
      optionEtc: f.optionEtc,
      publicMemo: f.publicMemo,
      secretMemo: f.secretMemo,

      orientations,
      aspect: aspect ?? "",
      aspectNo: Number(aspectNo ?? 0),
      aspect1,
      aspect2,
      aspect3,
      unitLines: f.unitLines,

      imageFolders,
      verticalImages,

      pinKind: f.pinKind,
    });

    await onSubmit?.(payload as any);
    onClose();
  }, [f, imageFolders, verticalImages, onSubmit, onClose]);

  // ✅ embedded 모드
  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        <HeaderContainer form={f} onClose={onClose} />

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 md:gap-6 px-4 md:px-5 py-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <ImagesContainer images={imagesProp} />
          <div className="space-y-4 md:space-y-6">
            <BasicInfoContainer form={f} />
            <NumbersContainer form={f} />
            <ParkingContainer form={parkingForm} />
            <CompletionRegistryContainer form={f} />
            <AspectsContainer form={f} />
            <AreaSetsContainer form={f} />
            <StructureLinesContainer form={f} />
            <OptionsContainer form={f} />
            <MemosContainer form={f} />
            <div className="h-16 md:hidden" />
          </div>
        </div>

        <FooterButtons
          onClose={onClose}
          onSave={save}
          canSave={isSaveEnabled}
        />
      </div>
    );
  }

  // 기본 모달
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
            <ParkingContainer form={parkingForm} />
            <CompletionRegistryContainer form={f} />
            <AspectsContainer form={f} />
            <AreaSetsContainer form={f} />
            <StructureLinesContainer form={f} />
            <OptionsContainer form={f} />
            <MemosContainer form={f} />
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
