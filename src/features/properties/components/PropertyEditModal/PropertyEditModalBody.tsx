"use client";

import { useMemo } from "react";
import FooterButtons from "../sections/FooterButtons/FooterButtons";

import type { PropertyEditModalProps } from "./types";

import { useEditImages } from "./hooks/useEditImages";
import { useEditForm } from "./hooks/useEditForm/useEditForm";
import { buildEditPayload } from "./lib/buildEditPayload";

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

export default function PropertyEditModalBody({
  onClose,
  onSubmit,
  initialData,
  embedded = false, // ✅ ViewModal 안에서 내용만 교체할 때 true
}: Omit<PropertyEditModalProps, "open"> & { embedded?: boolean }) {
  const propertyId = String((initialData as any)?.id ?? "");

  // 이미지 초기값: view 우선 + 레퍼런스 전달
  const initialImages = useMemo(() => {
    if (!initialData) return null;
    const v = (initialData as any).view ?? (initialData as any);
    return {
      _imageCardRefs: v?._imageCardRefs,
      _fileItemRefs: v?._fileItemRefs,
      imageFolders: v?.imageFolders,
      imagesByCard: v?.imagesByCard,
      imageCards: v?.imageCards,
      images: v?.images,
      imageCardCounts: v?.imageCardCounts,
      // 세로열: verticalImages 우선, 없으면 imagesVertical/fileItems 폴백
      verticalImages: v?.verticalImages ?? v?.imagesVertical ?? v?.fileItems,
      imagesVertical: v?.imagesVertical,
      fileItems: v?.fileItems,
    };
  }, [initialData]);

  // 이미지 훅
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
  } = useEditImages({ propertyId, initial: initialImages });

  // 폼 훅
  const f = useEditForm({ initialData });
  const isSaveEnabled = f.isSaveEnabled;

  const save = async () => {
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

    const payload = buildEditPayload({
      id: propertyId,
      title: f.title,
      address: f.address,
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
      registryOne: f.registryOne,
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
  };

  // ✅ embedded 모드: 오버레이/포지셔닝 없이 “바디만” 렌더 (ViewModal 내부에서 스왑용)
  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        <HeaderContainer form={f} onClose={onClose} />

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 md:gap-6 px-4 md:px-5 py-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <ImagesContainer
            images={{
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
            }}
          />

          <div className="space-y-4 md:space-y-6">
            <BasicInfoContainer form={f} />
            <NumbersContainer form={f} />
            <ParkingContainer form={f} />
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

  // 기본(standalone) 모달 렌더: 기존과 동일
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
            }}
          />

          <div className="space-y-6">
            <BasicInfoContainer form={f} />
            <NumbersContainer form={f} />
            <ParkingContainer form={f} />
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
