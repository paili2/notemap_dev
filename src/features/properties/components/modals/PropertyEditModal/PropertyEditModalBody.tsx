"use client";

import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { PropertyEditModalProps } from "./types";
import { useEditForm } from "./hooks/useEditForm/useEditForm";
import { useEditSave } from "./hooks/useEditSave";

import { useIsMobileBreakpoint } from "@/hooks/useIsMobileBreakpoint";
import { ALLOW_MOBILE_PROPERTY_EDIT } from "@/features/properties/constants";

import { CompletionRegistryFormSlice } from "@/features/properties/hooks/useEditForm/types";
import { mapBadgeToPinKind } from "@/features/properties/lib/badge";

import {
  EditAlertDialog,
  EmbeddedEditLayout,
  EmbeddedRestrictionLayout,
  ModalEditLayout,
  ModalRestrictionLayout,
} from "./ui/layouts/EditLayouts";
import { useBuildingGrade } from "./hooks/useBuildingGrade";
import { useParkingForm, type ParkingFormSlice } from "./hooks/useParkingForm";
import { useCompletionRegistryForm } from "./hooks/useCompletionRegistryForm";
import { useEditImages } from "./hooks/useEditImages";
import {
  BuildingType,
  normalizeBuildingTypeLabelToEnum,
} from "@/features/properties/types/property-domain";

/** ⭐ 매물평점 문자열 타입 (HeaderContainer의 parkingGrade에서 사용) */
type StarStr = "" | "1" | "2" | "3" | "4" | "5";

/** 어떤 입력이 와도 '' | '1'~'5' 로 정규화 */
function normalizeStarStr(v: unknown): StarStr {
  if (v == null) return "";
  const s = String(v).trim();
  return (["", "1", "2", "3", "4", "5"].includes(s) ? s : "") as StarStr;
}

/* ───────── main component ───────── */
export default function PropertyEditModalBody({
  onClose,
  onSubmit,
  /** 🔁 지도 핀 다시 불러오고 싶을 때 (예: get /map) */
  onLabelChanged,
  initialData,
  embedded = false,
}: Omit<PropertyEditModalProps, "open"> & {
  embedded?: boolean;
  onLabelChanged?: () => void | Promise<void>;
}) {
  // ✅ 모바일 수정 제한 토글
  const isMobile = useIsMobileBreakpoint(768);
  const canEditOnMobile = ALLOW_MOBILE_PROPERTY_EDIT;
  const canEditProperty = !isMobile || canEditOnMobile;

  // 🔔 공통 알림 모달 상태
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = useCallback((msg: string) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  }, []);

  // initialData 평탄화
  const normalizedInitial = useMemo(() => {
    const src = initialData as any;
    const raw = src?.raw ?? null;
    const view = src?.view ?? null;

    if (!raw && !view) {
      console.log("[init] normalizedInitial(fallback src):", src);
      return src ?? null;
    }

    // ✅ raw 값 보존 + view 에서 null/undefined 가 아닌 값만 덮어쓰기
    const merged: any = { ...(raw ?? {}) };
    if (view) {
      for (const [key, value] of Object.entries(view)) {
        if (value !== null && value !== undefined) {
          merged[key] = value;
        }
      }
    }

    console.log("[init] normalizedInitial(merged raw+view non-null):", {
      raw,
      view,
      merged,
    });

    return merged;
  }, [initialData]);

  const bridgedInitial = useMemo(() => {
    const src = normalizedInitial as any;
    if (!src) return null;

    const salePrice =
      src?.salePrice ??
      (src?.minRealMoveInCost != null
        ? String(src.minRealMoveInCost)
        : undefined);

    /* ───────── 건물유형 buildingType ───────── */
    let bt: BuildingType | undefined =
      (src?.buildingType as BuildingType | undefined) ?? undefined;

    // 서버에서 buildingType 이 비어 있는 케이스만 propertyType / type 으로 보완
    if (!bt) {
      const rawBt = src?.propertyType ?? src?.type;
      if (rawBt != null) {
        const mapped = normalizeBuildingTypeLabelToEnum(rawBt);
        if (mapped) {
          bt = mapped as BuildingType;
        }
      }
    }

    /* ───────── 등기/등록 타입 registry ───────── */
    let reg: BuildingType | undefined =
      (src?.registry as BuildingType | undefined) ?? undefined;

    if (!reg) {
      const registryCandidates = [
        src?.registryOne,
        src?.registrationType,
        src?.registrationTypeName,
      ];
      for (const cand of registryCandidates) {
        if (cand == null) continue;
        const mapped = normalizeBuildingTypeLabelToEnum(cand);
        if (mapped) {
          reg = mapped as BuildingType;
          break;
        }
      }
    }

    // 마지막 보완: registry 가 전혀 없으면 건물유형이라도 따라가게
    if (!reg && bt) {
      reg = bt;
    }

    const initPinKind =
      src?.pinKind ?? (src?.badge ? mapBadgeToPinKind(src.badge) : undefined);

    const out = {
      ...src,
      ...(salePrice !== undefined ? { salePrice } : {}),
      ...(bt !== undefined ? { buildingType: bt } : {}),
      ...(reg !== undefined ? { registry: reg } : {}),
      ...(initPinKind !== undefined ? { pinKind: initPinKind } : {}),
    };

    console.log("[init] bridgedInitial:", {
      id: out?.id,
      buildingType: out?.buildingType,
      registry: out?.registry,
      registrationType: out?.registrationType,
      registrationTypeName: out?.registrationTypeName,
      registrationTypeId: out?.registrationTypeId,
    });

    return out;
  }, [normalizedInitial]);

  // id
  const propertyId = useMemo(() => {
    const src = initialData as any;
    const id = src?.id ?? src?.raw?.id ?? src?.view?.id ?? "";
    const s = String(id ?? "");
    console.log("[init] propertyId:", s);
    return s;
  }, [initialData]);

  // 이미지 초기값
  const initialImages = useMemo(() => {
    const v = bridgedInitial as any;
    if (!v) return null;
    const out = {
      imageFolders: v?.imageFolders ?? v?.imageCards ?? null,
      images: v?.images ?? null,
      imageCardCounts: v?.imageCardCounts ?? null,
      verticalImages:
        v?.verticalImages ?? v?.imagesVertical ?? v?.fileItems ?? null,
      imagesVertical: v?.imagesVertical ?? null,
      fileItems: v?.fileItems ?? null,
    };
    console.log("[init] initialImages:", {
      hasFolders: !!out.imageFolders,
      hasVertical: !!out.verticalImages,
      files: Array.isArray(out.fileItems) ? out.fileItems.length : 0,
    });
    return out;
  }, [bridgedInitial]);

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
    queueGroupTitle,
    queueGroupSortOrder,
    queuePhotoCaption,
    queuePhotoSort,
    queuePhotoMove,
    hasImageChanges,
    commitImageChanges,
    commitPending,
  } = useEditImages({ propertyId, initial: initialImages });

  useEffect(() => {
    if (propertyId) reloadGroups(propertyId);
  }, [propertyId, reloadGroups]);

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
      queueGroupTitle,
      queueGroupSortOrder,
      queuePhotoCaption,
      queuePhotoSort,
      queuePhotoMove,
      hasImageChanges,
      commitImageChanges,
      commitPending,
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
      queueGroupTitle,
      queueGroupSortOrder,
      queuePhotoCaption,
      queuePhotoSort,
      queuePhotoMove,
      hasImageChanges,
      commitImageChanges,
      commitPending,
    ]
  );

  console.log("[EditModal] initialData(raw) =", initialData);
  console.log(
    "[EditModal] bridgedInitial(before useEditForm) =",
    bridgedInitial
  );

  // 폼 훅
  const f = useEditForm({ initialData: bridgedInitial });

  useEffect(() => {
    console.log("[form] mounted/useEditForm snapshot:", {
      title: f.title,
      pinKind: f.pinKind,
      buildingType: f.buildingType,
      registry: (f as any).registry,
      parkingGrade: f.parkingGrade,
    });
  }, []); // mount 1회

  useEffect(() => {
    console.log("[form] pinKind changed:", f.pinKind);
  }, [f.pinKind]);

  /** 건물 연식 관련 훅 */
  const {
    buildingGrade,
    buildingGradeTouched,
    initialBuildingGrade,
    hadAgeFlags,
    setBuildingGrade,
  } = useBuildingGrade({ bridgedInitial, form: f });

  /** HeaderContainer용 어댑터 */
  const headerForm = useMemo(
    () => ({
      title: f.title,
      setTitle: (v: string) => {
        console.log("[Header] title change:", v);
        f.setTitle(v);
      },
      parkingGrade: f.parkingGrade,
      setParkingGrade: (v: StarStr) => {
        const nv = normalizeStarStr(v);
        console.log("[Header] parkingGrade change:", v, "→", nv);
        f.setParkingGrade(nv);
      },
      elevator: f.elevator,
      setElevator: (v: any) => {
        console.log("[Header] elevator change:", v);
        f.setElevator(v);
      },
      pinKind: f.pinKind,
      setPinKind: (v: any) => {
        console.log("[Header] pinKind selected:", v);
        f.setPinKind(v);
      },

      buildingGrade,
      setBuildingGrade,

      rebateRaw: f.rebateRaw,
      setRebateRaw: (v: string) => {
        console.log("[Header] rebateRaw change:", v);
        f.setRebateRaw(v);
      },
    }),
    [
      f.title,
      f.setTitle,
      f.parkingGrade,
      f.setParkingGrade,
      f.elevator,
      f.setElevator,
      f.pinKind,
      f.setPinKind,
      buildingGrade,
      setBuildingGrade,
      f.rebateRaw,
      f.setRebateRaw,
    ]
  );

  useEffect(() => {
    console.log("[headerForm] snapshot:", {
      buildingGrade: headerForm.buildingGrade,
      pinKind: headerForm.pinKind,
    });
  }, [headerForm]);

  // ParkingContainer 지연 마운트
  const [mountParking, setMountParking] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMountParking(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /** ParkingContainer용 어댑터 훅 */
  const parkingForm: ParkingFormSlice = useParkingForm({ form: f });

  /** CompletionRegistryContainer용 어댑터 훅 */
  const completionRegistryForm: CompletionRegistryFormSlice =
    useCompletionRegistryForm({ form: f });

  /** ✅ 편집 모달 내부 스크롤 컨테이너의 가로 스크롤 강제 리셋 */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  /** 저장 로직 훅으로 분리 */
  const { save, canSaveNow } = useEditSave({
    form: f,
    bridgedInitial,
    propertyId,
    buildingGrade,
    buildingGradeTouched,
    hadAgeFlags,
    initialBuildingGrade,
    groups: groups ?? undefined,
    imageFolders: imageFolders ?? undefined,
    verticalImages: verticalImages ?? undefined,
    hasImageChanges,
    commitImageChanges,
    commitPending,
    showAlert,
    onSubmit,
    onClose,
    // ⭐ 여기서 지도 갱신 콜백까지 넘겨줌
    onLabelChanged,
  });

  /* ───────── 레이아웃 분기 ───────── */
  let content: ReactNode;

  if (embedded) {
    if (!canEditProperty) {
      content = (
        <EmbeddedRestrictionLayout headerForm={headerForm} onClose={onClose} />
      );
    } else {
      content = (
        <EmbeddedEditLayout
          headerForm={headerForm}
          onClose={onClose}
          scrollRef={scrollRef}
          imagesProp={imagesProp}
          form={f}
          mountParking={mountParking}
          parkingForm={parkingForm}
          completionRegistryForm={completionRegistryForm}
          save={save}
          canSaveNow={canSaveNow}
        />
      );
    }
  } else {
    if (!canEditProperty) {
      content = <ModalRestrictionLayout onClose={onClose} />;
    } else {
      content = (
        <ModalEditLayout
          headerForm={headerForm}
          onClose={onClose}
          scrollRef={scrollRef}
          imagesProp={imagesProp}
          form={f}
          mountParking={mountParking}
          parkingForm={parkingForm}
          completionRegistryForm={completionRegistryForm}
          save={save}
          canSaveNow={canSaveNow}
        />
      );
    }
  }

  return (
    <>
      {content}
      <EditAlertDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        message={alertMessage}
      />
    </>
  );
}
