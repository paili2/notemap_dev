"use client";

import FooterButtons from "../sections/FooterButtons/FooterButtons";

import type { PropertyEditModalProps } from "./types";

import { useEditImages } from "./hooks/useEditImages";
import { useEditForm } from "./hooks/useEditForm";
import { buildEditPayload } from "./lib/buildEditPayload";

import { useMemo } from "react";
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
}: Omit<PropertyEditModalProps, "open">) {
  const propertyId = String((initialData as any)?.id ?? "");

  const initialImages = useMemo(() => {
    if (!initialData) return null;
    return {
      imageFolders: (initialData as any).imageFolders,
      imagesByCard: (initialData as any).imagesByCard,
      imageCards: (initialData as any).imageCards,
      images: (initialData as any).images,
      imageCardCounts: (initialData as any).imageCardCounts,
      verticalImages: (initialData as any).verticalImages,
      imagesVertical: (initialData as any).imagesVertical,
      fileItems: (initialData as any).fileItems,
    };
  }, [initialData]);

  // 이미지 훅 (초기 하이드레이션 포함)
  const {
    imageFolders,
    verticalImages,
    registerImageInput,
    openImagePicker,
    onPickFilesToFolder,
    addPhotoFolder,
    onChangeImageCaption,
    handleRemoveImage,
    onAddFiles,
    onChangeFileItemCaption,
    handleRemoveFileItem,
  } = useEditImages({
    propertyId,
    initial: initialImages,
  });

  // 폼 상태 훅 (초기값 주입 + 유효성)
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

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        <HeaderContainer form={f} onClose={onClose} />

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <ImagesContainer
            images={{
              imageFolders,
              verticalImages,
              registerImageInput,
              openImagePicker,
              onPickFilesToFolder,
              addPhotoFolder,
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
