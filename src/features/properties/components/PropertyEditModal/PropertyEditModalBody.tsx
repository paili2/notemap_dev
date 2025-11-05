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
import { useQueryClient } from "@tanstack/react-query";

type ParkingFormSlice = ComponentProps<typeof ParkingContainer>["form"];

/* ───────── helpers ───────── */
const N = (v: any): number | undefined => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};
const S = (v: any): string | undefined => {
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : undefined;
};

/** 서버 등기/용도 값 → 폼 내부 코드 매핑 */
function mapRegistry(v: any): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();

  if (["house", "housing", "주택"].includes(s)) return "주택";
  if (["apt", "apartment", "아파트"].includes(s)) return "APT";
  if (["op", "officetel", "오피스텔", "오피스텔형"].includes(s)) return "OP";
  if (
    ["urban", "urb", "도생", "도시생활형", "도시생활형주택", "도/생"].includes(
      s
    )
  )
    return "도/생";
  if (["near", "nearlife", "근생", "근린생활시설", "근/생"].includes(s))
    return "근/생";

  if (["주택", "APT", "OP", "도/생", "근/생"].includes(String(v)))
    return String(v);
  if (["residential"].includes(s)) return "주택";
  if (["commercial"].includes(s)) return "근/생";
  return undefined;
}

/* ───────── 서버 PATCH 전용 유틸(변경분만 생성) ───────── */
const normalizeShallow = (v: any) => {
  if (v === "" || v === null || v === undefined) return undefined;
  if (Array.isArray(v) && v.length === 0) return undefined;
  return v;
};
const jsonEq = (a: any, b: any) => {
  const na = normalizeShallow(a);
  const nb = normalizeShallow(b);
  if (na === nb) return true;
  if (!na || !nb || typeof na !== "object" || typeof nb !== "object")
    return false;
  try {
    return JSON.stringify(na) === JSON.stringify(nb);
  } catch {
    return false;
  }
};

/** unit 정규화/비교 (서버 전송 규칙: 변경시 전체 배열 전송) */
type UnitLike = {
  rooms?: number | string | null;
  baths?: number | string | null;
  duplex?: boolean;
  terrace?: boolean;
  primary?: number | string | null;
  secondary?: number | string | null;
  hasLoft?: boolean;
  hasTerrace?: boolean;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  note?: string | null;
};
const bPick = (u: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = u?.[k];
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
  }
  return false;
};
const nPick = <T,>(u: any, ...keys: string[]) => {
  for (const k of keys) if (u?.[k] !== undefined) return u[k] as T;
  return undefined as unknown as T;
};
const toNumOrNull = (v: any): number | null => {
  const n = N(v);
  return n === undefined ? null : n;
};
const normUnit = (u?: UnitLike) => {
  const x: any = u ?? {};
  return {
    rooms: toNumOrNull(nPick(x, "rooms")),
    baths: toNumOrNull(nPick(x, "baths")),
    hasLoft: bPick(x, "hasLoft", "duplex"),
    hasTerrace: bPick(x, "hasTerrace", "terrace"),
    minPrice: toNumOrNull(nPick(x, "minPrice", "primary")),
    maxPrice: toNumOrNull(nPick(x, "maxPrice", "secondary")),
    note: nPick<string | null>(x, "note") ?? null,
  };
};
const sameUnit = (a?: UnitLike, b?: UnitLike) => {
  const A = normUnit(a);
  const B = normUnit(b);
  return (
    A.rooms === B.rooms &&
    A.baths === B.baths &&
    A.hasLoft === B.hasLoft &&
    A.hasTerrace === B.hasTerrace &&
    A.minPrice === B.minPrice &&
    A.maxPrice === B.maxPrice &&
    A.note === B.note
  );
};
const unitsChanged = (prev?: any[], curr?: any[]) => {
  const P = Array.isArray(prev) ? prev : undefined;
  const C = Array.isArray(curr) ? curr : undefined;
  if (!P && !C) return false;
  if (!P || !C) return true;
  if (P.length !== C.length) return true;
  for (let i = 0; i < P.length; i++) if (!sameUnit(P[i], C[i])) return true;
  return false;
};

/** 초기 스냅샷: 임의 키 허용(레거시 호환) */
type InitialSnapshot = { [key: string]: any };

/** 폼 → 서버 최소 PATCH (변경된 것만, units는 묶음 전체전송) */
function toPinPatch(
  f: ReturnType<typeof useEditForm>,
  initial: InitialSnapshot
): UpdatePinDto {
  const patch: Partial<UpdatePinDto> = {};

  // ── 등기/용도 → 서버 키: buildingType ──
  const btInitRaw =
    (initial as any)?.registry ??
    (initial as any)?.registryOne ??
    (initial as any)?.buildingType ??
    (initial as any)?.type ??
    (initial as any)?.propertyType;

  // 현재값 후보 (폼 구현이 어떤 키를 쓰든 잡아낸다)
  const nowRawCandidates = [
    (f as any).registry,
    (f as any).registryOne,
    (f as any).buildingType,
    (f as any).type,
    (f as any).propertyType,
  ];

  // "-", "", null → undefined
  const asMeaningful = (v: any): string | undefined => {
    if (v === null || v === undefined) return undefined;
    const s = String(v).trim();
    if (!s || s === "-" || s === "—") return undefined;
    return s;
  };
  // 표준화: mapRegistry가 인식하면 그 값, 아니면 공백 아닌 문자열 그대로
  const normalizeBT = (v: any): string | undefined => {
    const mapped = mapRegistry(v);
    if (mapped) return mapped;
    return asMeaningful(v);
  };

  const btInit = normalizeBT(btInitRaw);
  let btNow: string | undefined;
  for (const c of nowRawCandidates) {
    const vv = normalizeBT(c);
    if (vv !== undefined) {
      btNow = vv;
      break;
    }
  }
  if (btNow !== undefined && btNow !== btInit) {
    (patch as any).buildingType = btNow;
  }

  // ── 경사/구조 ──
  if (!jsonEq((initial as any)?.slopeGrade, f.slopeGrade)) {
    (patch as any).slopeGrade = f.slopeGrade ?? undefined;
  }
  if (!jsonEq((initial as any)?.structureGrade, f.structureGrade)) {
    (patch as any).structureGrade = f.structureGrade ?? undefined;
  }

  // ── 주차 평점(숫자) ──
  const pgNow =
    f.parkingGrade && String(f.parkingGrade).trim() !== ""
      ? Number(f.parkingGrade)
      : undefined;
  const pgInitRaw = (initial as any)?.parkingGrade;
  const pgInit =
    pgInitRaw && String(pgInitRaw).trim() !== ""
      ? Number(pgInitRaw)
      : undefined;
  if (!jsonEq(pgInit, pgNow) && pgNow !== undefined) {
    (patch as any).parkingGrade = pgNow;
  }

  // ── 구조(units): 변경 감지 시 전체 배열 전송 ──
  const initialUnits = ((initial as any)?.unitLines ??
    (initial as any)?.units) as any[] | undefined;
  const currentUnits = (f.unitLines ?? []) as any[];

  if (unitsChanged(initialUnits, currentUnits)) {
    const units = (currentUnits ?? [])
      .map((u) => {
        const n = normUnit(u as UnitLike);
        const hasAny =
          n.rooms != null ||
          n.baths != null ||
          n.hasLoft ||
          n.hasTerrace ||
          n.minPrice != null ||
          n.maxPrice != null ||
          (n.note ?? "") !== "";
        return hasAny
          ? {
              rooms: n.rooms,
              baths: n.baths,
              hasLoft: n.hasLoft,
              hasTerrace: n.hasTerrace,
              minPrice: n.minPrice,
              maxPrice: n.maxPrice,
              note: n.note ?? null,
            }
          : null;
      })
      .filter(Boolean) as NonNullable<UpdatePinDto["units"]>;
    (patch as any).units = units;
  }

  return patch as UpdatePinDto;
}

/* ───────── component ───────── */
export default function PropertyEditModalBody({
  onClose,
  onSubmit,
  initialData,
  embedded = false,
}: Omit<PropertyEditModalProps, "open"> & { embedded?: boolean }) {
  const queryClient = useQueryClient();

  /** 1) initialData 정규화: {raw, view} 래핑 → 평탄화 */
  const normalizedInitial = useMemo(() => {
    const src = initialData as any;
    return src?.raw ?? src?.view ?? src ?? null;
  }, [initialData]);

  /** 2) 브릿지: 최저실입/등기 값 정규화 */
  const bridgedInitial = useMemo(() => {
    const src = normalizedInitial as any;
    if (!src) return null;

    // 최저실입 → salePrice(문자)
    const salePrice =
      src?.salePrice ??
      (src?.minRealMoveInCost != null
        ? String(src.minRealMoveInCost)
        : undefined);

    // 등기 매핑
    const rawReg =
      src?.registry ??
      src?.registryOne ??
      src?.type ??
      src?.propertyType ??
      src?.buildingType;
    const reg = mapRegistry(rawReg);

    return {
      ...src,
      ...(salePrice !== undefined ? { salePrice } : {}),
      ...(reg !== undefined
        ? { registry: reg, registryOne: reg, buildingType: reg }
        : {}),
    };
  }, [normalizedInitial]);

  // id 문자열 고정
  const propertyId = useMemo(() => {
    const src = initialData as any;
    const id = src?.id ?? src?.raw?.id ?? src?.view?.id ?? "";
    return String(id ?? "");
  }, [initialData]);

  /** 초기 이미지 세팅 (브릿지된 view 기준) */
  const initialImages = useMemo(() => {
    const v = bridgedInitial as any;
    if (!v) return null;
    return {
      imageFolders: v?.imageFolders ?? v?.imageCards ?? null,
      images: v?.images ?? null,
      imageCardCounts: v?.imageCardCounts ?? null,
      verticalImages:
        v?.verticalImages ?? v?.imagesVertical ?? v?.fileItems ?? null,
      imagesVertical: v?.imagesVertical ?? null,
      fileItems: v?.fileItems ?? null,
    };
  }, [bridgedInitial]);

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

  /** ⬅️ 폼 훅에 bridgedInitial을 넘긴다 */
  const f = useEditForm({ initialData: bridgedInitial });

  /** ParkingContainer 지연 마운트 */
  const [mountParking, setMountParking] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMountParking(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /** Parking setters 안정 프록시 */
  const setParkingTypeProxy = useCallback(
    (v: string | null) => f.setParkingType(v ?? ""),
    [f.setParkingType]
  );
  const setTotalParkingSlotsProxy = useCallback(
    (v: string | null) => f.setTotalParkingSlots(v ?? ""),
    [f.setTotalParkingSlots]
  );

  /** Parking form 어댑터 */
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

    // 1) 서버 최소 PATCH (변경된 것만, units는 변경 시 전체 배열)
    try {
      const dto = toPinPatch(f, bridgedInitial as InitialSnapshot);
      if (Object.keys(dto).length > 0) {
        await updatePin(propertyId, dto);
        // 상세 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ["pinDetail", propertyId] });
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[PATCH /pins/:id] 실패]:", e);
      alert(e?.message || "핀 수정 중 오류가 발생했습니다.");
      return;
    }

    // 2) 로컬 view 갱신 payload (UI 동기화)
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

      // 로컬 상태 업데이트용
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
  }, [
    f,
    bridgedInitial,
    propertyId,
    onSubmit,
    onClose,
    imageFolders,
    verticalImages,
    queryClient,
  ]);

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
