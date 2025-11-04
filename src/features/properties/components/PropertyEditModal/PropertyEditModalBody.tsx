// src/features/properties/components/PropertyEditModal/PropertyEditModalBody.tsx
"use client";

import {
  ComponentProps,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
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

  /** 초기 이미지 세팅(가로 카드 + 세로 카드 모두 수집, 별칭들도 호환) */
  const initialImages = useMemo(() => {
    if (!initialData) return null;
    const v = (initialData as any).view ?? (initialData as any);
    return {
      imageFolders: v?.imageFolders ?? v?.imageCards ?? null, // 가로 카드들
      images: v?.images ?? null, // 평면(레거시)
      imageCardCounts: v?.imageCardCounts ?? null,

      // 세로 카드(여러 별칭 호환)
      verticalImages:
        v?.verticalImages ?? v?.imagesVertical ?? v?.fileItems ?? null,
      imagesVertical: v?.imagesVertical ?? null,
      fileItems: v?.fileItems ?? null,
    };
  }, [initialData]);

  /** 이미지 훅(업로드/그룹/커버/정렬 등 서버 연동 포함) */
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

  /** ImagesContainer 통합 prop */
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

  /** 폼 훅 */
  const f = useEditForm({ initialData });

  /** ✅ ParkingContainer 지연 마운트(첫 프레임 지나고) */
  const [mountParking, setMountParking] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMountParking(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /** ✅ 안정 프록시(setter) */
  const setParkingTypeProxy = useCallback(
    (v: string | null) => f.setParkingType(v ?? ""),
    [f.setParkingType]
  );

  const setTotalParkingSlotsProxy = useCallback(
    (v: string | null) => f.setTotalParkingSlots(v ?? ""),
    [f.setTotalParkingSlots]
  );

  /** ✅ ParkingContainer 어댑터(값/함수 모두 고정) */
  const parkingForm: ParkingFormSlice = useMemo(
    () => ({
      parkingType: f.parkingType || null,
      setParkingType: setParkingTypeProxy,

      // 내부는 string 상태지만, UI에서 빈값은 null로 보여주고 저장시 buildUpdatePayload가 정규화
      totalParkingSlots:
        f.totalParkingSlots === "" ? null : String(f.totalParkingSlots),
      setTotalParkingSlots: setTotalParkingSlotsProxy,
    }),
    [
      f.parkingType,
      f.totalParkingSlots,
      setParkingTypeProxy,
      setTotalParkingSlotsProxy,
    ]
  );

  const isSaveEnabled = f.isSaveEnabled;

  /** 저장 */
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
      // 기본
      title: f.title,
      address: f.address,
      officeName: f.officeName,
      officePhone: f.officePhone,
      officePhone2: f.officePhone2,
      moveIn: f.moveIn,
      floor: f.floor,
      roomNo: f.roomNo,
      structure: f.structure,

      // 주차/준공/가격/평점
      parkingGrade: f.parkingGrade,
      parkingType: f.parkingType,
      totalParkingSlots: f.totalParkingSlots,
      completionDate: f.completionDate,
      salePrice: f.salePrice,

      // 면적
      baseAreaSet: f.baseAreaSet,
      extraAreaSets: f.extraAreaSets,
      exclusiveArea,
      realArea,
      extraExclusiveAreas,
      extraRealAreas,
      baseAreaTitleOut,
      extraAreaTitlesOut,

      // 등기/등급/엘리베이터
      elevator: f.elevator,
      registryOne: f.registry,
      slopeGrade: f.slopeGrade,
      structureGrade: f.structureGrade,

      // 숫자
      totalBuildings: f.totalBuildings,
      totalFloors: f.totalFloors,
      totalHouseholds: f.totalHouseholds,
      remainingHouseholds: f.remainingHouseholds,

      // 옵션/메모
      options: f.options,
      etcChecked: f.etcChecked,
      optionEtc: f.optionEtc,
      publicMemo: f.publicMemo,
      secretMemo: f.secretMemo,

      // 향/유닛
      orientations,
      aspect: aspect ?? "",
      aspectNo: Number(aspectNo ?? 0),
      aspect1,
      aspect2,
      aspect3,
      unitLines: f.unitLines,

      // 이미지(가로 카드 + 세로 카드; buildUpdatePayload에서 URL 평면화/중복제거)
      imageFolders,
      verticalImages,

      // 기타
      pinKind: f.pinKind,
    });

    await onSubmit?.(payload as any);
    onClose();
  }, [f, imageFolders, verticalImages, onSubmit, onClose]);

  /* ========== embedded 레이아웃 ========== */
  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        <HeaderContainer form={f} onClose={onClose} />

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 md:gap-6 px-4 md:px-5 py-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <ImagesContainer images={imagesProp} />
          <div className="space-y-4 md:space-y-6">
            <BasicInfoContainer form={f} />
            <NumbersContainer form={f} />
            {mountParking && <ParkingContainer form={parkingForm} />}{" "}
            {/* ✅ 지연 마운트 */}
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

  /* ========== 기본 모달 레이아웃 ========== */
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
            {mountParking && <ParkingContainer form={parkingForm} />}{" "}
            {/* ✅ 지연 마운트 */}
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
