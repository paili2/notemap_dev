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
import { updatePin, UpdatePinDto } from "@/shared/api/pins";

type ParkingFormSlice = ComponentProps<typeof ParkingContainer>["form"];

/** 숫자/문자 헬퍼 */
const N = (v: any): number | undefined => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};
const S = (v: any): string | undefined => {
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : undefined;
};

/** 폼 → 최소 PATCH (사용자가 손댄 것만 보냄) */
function toPinPatch(f: ReturnType<typeof useEditForm>): UpdatePinDto {
  const contactMainPhone = S(f.officePhone);
  const contactSubPhone = S(f.officePhone2);
  const minRealMoveInCost = N(f.salePrice);

  const units = (f.unitLines ?? [])
    .map((u) => {
      const rooms = N(u?.rooms);
      const baths = N(u?.baths);
      const hasLoft = !!u?.duplex;
      const hasTerrace = !!u?.terrace;
      const minPrice = N((u as any)?.primary);
      const maxPrice = N((u as any)?.secondary);

      const hasAny =
        rooms != null ||
        baths != null ||
        hasLoft ||
        hasTerrace ||
        minPrice != null ||
        maxPrice != null;

      return hasAny
        ? {
            rooms: rooms ?? null,
            baths: baths ?? null,
            hasLoft,
            hasTerrace,
            minPrice: minPrice ?? null,
            maxPrice: maxPrice ?? null,
          }
        : null;
    })
    .filter(Boolean) as NonNullable<UpdatePinDto["units"]>;

  const out: Partial<UpdatePinDto> = {};

  if (contactMainPhone !== undefined) out.contactMainPhone = contactMainPhone;
  if (contactSubPhone !== undefined) out.contactSubPhone = contactSubPhone;
  if (minRealMoveInCost !== undefined)
    out.minRealMoveInCost = minRealMoveInCost;
  if (units.length > 0) out.units = units;

  return out as UpdatePinDto; // OK
}

export default function PropertyEditModalBody({
  onClose,
  onSubmit,
  initialData,
  embedded = false,
}: Omit<PropertyEditModalProps, "open"> & { embedded?: boolean }) {
  const propertyId = String((initialData as any)?.id ?? "");

  /** 초기 이미지 세팅 */
  const initialImages = useMemo(() => {
    if (!initialData) return null;
    const v = (initialData as any).view ?? (initialData as any);
    return {
      imageFolders: v?.imageFolders ?? v?.imageCards ?? null,
      images: v?.images ?? null,
      imageCardCounts: v?.imageCardCounts ?? null,
      verticalImages:
        v?.verticalImages ?? v?.imagesVertical ?? v?.fileItems ?? null,
      imagesVertical: v?.imagesVertical ?? null,
      fileItems: v?.fileItems ?? null,
    };
  }, [initialData]);

  /** 이미지 훅 */
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

  /** ✅ ParkingContainer 지연 마운트 */
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

  /** ✅ ParkingContainer 어댑터 */
  const parkingForm: ParkingFormSlice = useMemo(
    () => ({
      parkingType: f.parkingType || null,
      setParkingType: setParkingTypeProxy,
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
    if (!f.title.trim()) {
      alert("이름(제목)을 입력하세요.");
      return;
    }

    // 1) 서버 최소 PATCH
    try {
      const dto = toPinPatch(f);
      if (Object.keys(dto).length > 0) {
        await updatePin(propertyId, dto);
      }
    } catch (e: any) {
      console.error("[PATCH /pins/:id] 실패:", e);
      alert(e?.message || "핀 수정 중 오류가 발생했습니다.");
      return;
    }

    // 2) 로컬 view 갱신(기존 동작)
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

      // 이하 전부 로컬 상태 업데이트용(서버 PATCH와 무관)
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
  }, [f, propertyId, onSubmit, onClose, imageFolders, verticalImages]);

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
            {mountParking && <ParkingContainer form={parkingForm} />}
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
            {mountParking && <ParkingContainer form={parkingForm} />}
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
