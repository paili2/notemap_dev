"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type React from "react";
import { createPortal } from "react-dom";
import { Trash2, Pencil } from "lucide-react";

import type { PropertyViewDetails } from "./types";
import { useViewForm } from "./hooks/useViewForm";
import HeaderViewContainer from "./ui/HeaderViewContainer";
import DisplayImagesContainer from "./ui/DisplayImagesContainer";
import BasicInfoViewContainer from "./ui/BasicInfoViewContainer";
import NumbersViewContainer from "./ui/NumbersViewContainer";
import ParkingViewContainer from "./ui/ParkingViewContainer";
import CompletionRegistryViewContainer from "./ui/CompletionRegistryViewContainer";
import AspectsViewContainer from "./ui/AspectsViewContainer";
import AreaSetsViewContainer from "./ui/AreaSetsViewContainer";
import StructureLinesListContainer from "./ui/StructureLinesListContainer";
import OptionsBadgesContainer from "./ui/OptionsBadgesContainer";
import MemosContainer from "./ui/MemosContainer";

import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { deletePin } from "@/shared/api/pins";

import MetaInfoContainer from "./sections/MetaInfoContainer";
import { useMemoViewMode } from "@/features/properties/store/useMemoViewMode";
import { useMe } from "@/shared/api/auth";
import { useIsMobileBreakpoint } from "@/hooks/useIsMobileBreakpoint";
import { ALLOW_MOBILE_PROPERTY_EDIT } from "@/features/properties/constants";
import { useToast } from "@/hooks/use-toast";
import { usePinDetail } from "@/features/properties/hooks/useEditForm/usePinDetail";
import type {
  CreatePayload,
  UpdatePayload,
} from "@/features/properties/types/property-dto";
import PropertyEditModalBody from "../PropertyEditModal/PropertyEditModalBody";

/* utils */
const toUndef = <T,>(v: T | null | undefined): T | undefined => v ?? undefined;

// 지도 이벤트만 막고 기본 클릭은 그대로 두기
function eat(e: any) {
  try {
    (window as any)?.kakao?.maps?.event?.preventMap?.();
  } catch {}
}

/** ✅ 로컬 뷰 동기화용 패치에 ageType 반영 */
function toViewPatchFromEdit(
  p: UpdatePayload & Partial<CreatePayload>
): Partial<PropertyViewDetails> {
  const anyP = p as any;
  const patch: any = {
    ...(p as any),
    publicMemo: toUndef(anyP.publicMemo),
    secretMemo: toUndef(anyP.secretMemo),
    completionDate: toUndef(anyP.completionDate),
    parkingType: toUndef(anyP.parkingType),
    minRealMoveInCost: toUndef(anyP.minRealMoveInCost),
  };

  // age 관련 필드를 수정했으면 ageType 계산해서 반영
  const touchedAgeKey =
    "ageType" in anyP ||
    "isNew" in anyP ||
    "isOld" in anyP ||
    "buildingAgeType" in anyP ||
    "buildingGrade" in anyP;

  if (touchedAgeKey) {
    const ageType = deriveAgeTypeFrom(anyP);
    patch.ageType = ageType;
  }

  return patch;
}

type Stage = "view" | "edit";
type ViewDataWithEdit = PropertyViewDetails & { editInitial?: any };

function ensureInitialForEdit(args: {
  qData: any;
  data?: ViewDataWithEdit | null;
  effectiveId?: string | number | null | undefined;
}) {
  const { qData, data, effectiveId } = args;
  const raw = qData?.raw ?? null;
  const view = (qData?.view ?? data ?? null) as
    | PropertyViewDetails
    | (PropertyViewDetails & { editInitial?: any })
    | null;

  if (!raw && !view) return null;

  const ensuredId =
    (raw && raw.id) ??
    (view as any)?.id ??
    (data as any)?.id ??
    effectiveId ??
    null;

  const ensuredView =
    ensuredId != null ? { ...(view as any), id: ensuredId } : (view as any);

  const fromProp = (data as any)?.editInitial;
  if (fromProp && (fromProp.view || fromProp.raw)) {
    if (fromProp.view && ensuredId != null) {
      fromProp.view = { ...(fromProp.view ?? {}), id: ensuredId };
    }
    return fromProp;
  }

  if (raw || qData?.view) return { raw, view: ensuredView };
  return { view: ensuredView };
}

/* === 연식 관련 유틸 === */
function normalizeBoolLoose(v: unknown): boolean | undefined {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  if (typeof v === "number") return v !== 0 ? true : false;
  return undefined;
}

/** ✅ 우선순위: ageType → isNew/isOld → buildingAgeType → buildingGrade(레거시) */
function deriveAgeTypeFrom(src: any): "NEW" | "OLD" | null {
  // 1) 신규 필드: ageType 우선
  const t0 = (src?.ageType ?? "").toString().toUpperCase();
  if (t0 === "NEW" || t0 === "OLD") return t0 as "NEW" | "OLD";

  // 2) 레거시 bool 플래그
  const nIsNew = normalizeBoolLoose(src?.isNew);
  const nIsOld = normalizeBoolLoose(src?.isOld);
  if (nIsNew === true && nIsOld !== true) return "NEW";
  if (nIsOld === true && nIsNew !== true) return "OLD";

  // 3) 레거시 buildingAgeType 문자열
  const t = (src?.buildingAgeType ?? "").toString().toUpperCase();
  if (t === "NEW" || t === "OLD") return t as "NEW" | "OLD";

  // 4) 레거시 buildingGrade(new/old) 문자열
  const g = (src?.buildingGrade ?? "").toString().toLowerCase();
  if (g === "new") return "NEW";
  if (g === "old") return "OLD";

  return null;
}

export default function PropertyViewModal({
  open,
  onClose,
  data,
  pinId,
  onSave,
  onDelete,
  /** ✅ 카드 안에서만 쓸 때: 딤/포털/포지셔닝 없이 패널만 렌더 */
  asInner,
}: {
  open: boolean;
  onClose: () => void;
  data?: ViewDataWithEdit | null;
  pinId?: string | number | null;
  onSave?: (patch: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  asInner?: boolean;
}) {
  const [stage, setStage] = useState<Stage>("view");
  const [deleting, setDeleting] = useState(false);
  useBodyScrollLock(open && !asInner);

  const [editInitial, setEditInitial] = useState<any | null>(null);

  /** ✅ 마지막으로 저장한 UpdatePayload (향/개별평수 등 포함) */
  const [lastEditPayload, setLastEditPayload] = useState<any | null>(null);

  const effectiveId =
    pinId ?? (data as any)?.id ?? (data as any)?.propertyId ?? undefined;

  const q = usePinDetail(effectiveId as any, !!(open && effectiveId));

  const viewData: PropertyViewDetails | null = useMemo(() => {
    const v = (q.data as any)?.view as PropertyViewDetails | undefined;
    if (v) return v;
    return (data as PropertyViewDetails) ?? null;
  }, [q.data, data]);

  // ✅ 메타 정보로 쓸 데이터(raw + view를 통째로 넘김)
  const metaDetails = useMemo(
    () => (q.data as any) ?? (data as any) ?? viewData,
    [q.data, data, viewData]
  );

  const initialForEdit: any | null = useMemo(() => {
    return ensureInitialForEdit({ qData: q.data, data, effectiveId });
  }, [q.data, data, effectiveId]);

  const headingId = "property-view-modal-heading";
  const descId = "property-view-modal-desc";

  const idForActions =
    (q.data as any)?.raw?.id ??
    (data as any)?.id ??
    (data as any)?.propertyId ??
    effectiveId;

  /** 핀이 바뀌면 마지막 payload 리셋 */
  useEffect(() => {
    setLastEditPayload(null);
  }, [pinId]);

  /** ✅ DELETE /pins/:id 사용 */
  const handleDelete = useCallback(async () => {
    if (!idForActions || deleting) return;

    const numericId = Number(idForActions);
    if (!Number.isFinite(numericId)) {
      alert("삭제할 핀 ID가 올바르지 않습니다.");
      return;
    }

    if (
      !confirm("정말 이 매물을 삭제할까요?\n삭제 후에는 되돌릴 수 없습니다.")
    ) {
      return;
    }

    try {
      setDeleting(true);
      await deletePin(numericId);
      await onDelete?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.responseData?.message ||
        "삭제 요청에 실패했습니다.";
      alert(msg);
    } finally {
      setDeleting(false);
    }
  }, [idForActions, deleting, onDelete, onClose]);

  const onEditClose = useCallback(() => {
    setStage("view");
    setEditInitial(null);
  }, []);

  const onEditSubmit = useCallback(
    async (payload: UpdatePayload & Partial<CreatePayload>) => {
      console.log("[PropertyViewModal] onEditSubmit payload =", payload);
      try {
        const viewPatch = toViewPatchFromEdit(payload);

        // ✅ 어떤 매물인지 id를 최대한 안전하게 찾기
        const idFromPayload = (payload as any)?.id;
        const patchId =
          idFromPayload ??
          (viewData as any)?.id ??
          (metaDetails as any)?.raw?.id ??
          idForActions ??
          null;

        const finalPatch =
          patchId != null ? { ...viewPatch, id: patchId } : viewPatch;

        /** ✅ 다음 수정 모달 초기값으로 쓰기 위해 payload 저장 */
        setLastEditPayload(payload);

        // ✅ 부모에 패치 전달 (리스트/선택된 매물 갱신용)
        await onSave?.(finalPatch);
      } finally {
        // ✅ 무조건 뷰 스테이지로 복귀
        setStage("view");
        setEditInitial(null);
      }
    },
    [onSave, viewData, metaDetails, idForActions]
  );

  if (!open) return null;

  const portalChild =
    stage === "edit" && (editInitial || initialForEdit) ? (
      <EditStage
        key={`edit-${String(
          (editInitial as any)?.raw?.id ??
            (editInitial as any)?.view?.id ??
            (initialForEdit as any)?.raw?.id ??
            (initialForEdit as any)?.view?.id ??
            idForActions ??
            ""
        )}`}
        initialData={editInitial ?? initialForEdit}
        onClose={onEditClose}
        onSubmit={onEditSubmit}
        asInner={asInner}
      />
    ) : (
      <ViewStage
        key={`view-${String(idForActions ?? "")}`}
        data={viewData}
        metaDetails={metaDetails}
        headingId={headingId}
        descId={descId}
        onClose={onClose}
        onDelete={handleDelete}
        deleting={deleting}
        loading={!!(open && effectiveId && q.isFetching && !viewData)}
        onRequestEdit={(seed) => {
          setEditInitial(seed);
          setStage("edit");
        }}
        onClickEdit={() => {}}
        asInner={asInner}
        initialForEdit={initialForEdit}
        lastEditPayload={lastEditPayload}
      />
    );

  // ✅ 단일 모달 호스트(stage create/view/edit) 안에서 쓸 때는
  // asInner=true로 넘겨서 카드 패널만 사용
  if (asInner) {
    return portalChild;
  }

  return typeof document !== "undefined"
    ? createPortal(portalChild, document.body)
    : portalChild;
}

/* ================= View ================= */
function ViewStage({
  data,
  metaDetails,
  headingId,
  descId,
  onClose,
  onClickEdit,
  onDelete,
  deleting,
  loading,
  onRequestEdit,
  asInner,
  initialForEdit,
  lastEditPayload,
}: {
  data: PropertyViewDetails | null;
  metaDetails: any;
  headingId: string;
  descId: string;
  onClose: () => void;
  onClickEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  loading?: boolean;
  onRequestEdit: (seed: any) => void;
  asInner?: boolean;
  /** ✅ 쿼리 결과/부모 prop 기반 최초 initialForEdit(raw+view) */
  initialForEdit: any | null;
  /** ✅ 마지막으로 저장한 payload (있으면 이걸 우선 사용) */
  lastEditPayload: any | null;
}) {
  console.log("[PropertyViewModal/ViewStage] render", { data });

  // ✅ 현재 로그인 유저 정보
  const { data: me } = useMe();
  const { toast } = useToast();

  // ✅ 모바일 여부 & 모바일 수정 가능 여부
  const isMobile = useIsMobileBreakpoint(768);
  const canEditOnMobile = ALLOW_MOBILE_PROPERTY_EDIT;
  const canEditProperty = !isMobile || canEditOnMobile;
  const showEditButton = !isMobile || canEditOnMobile;

  // ✅ 삭제 버튼 노출 권한: 부장 / 팀장만
  const role = me?.role;
  const canDelete = ["admin", "manager"].includes(role ?? "");

  const hasData = !!data;
  const formInput = useMemo(
    () => ({ open: true, data: data ?? ({} as PropertyViewDetails) }),
    [data]
  );
  const f = useViewForm(formInput);

  // ✅ ageType은 뷰데이터 + 폼 상태 합쳐서 계산
  const ageType = useMemo<"NEW" | "OLD" | null>(() => {
    const src = { ...(data as any), ...(f as any) };
    const resolved = deriveAgeTypeFrom(src);

    console.log("[PropertyViewModal/ViewStage] ageType", {
      src,
      resolved,
    });

    return resolved;
  }, [data, f]);

  const rebateTextFromSources = useMemo(() => {
    const fromView = (data as any)?.rebateText;
    const fromForm = (f as any)?.rebateText;
    const fromMetaRoot = (metaDetails as any)?.rebateText;
    const fromRaw = (metaDetails as any)?.raw?.rebateText;

    return fromView ?? fromForm ?? fromMetaRoot ?? fromRaw ?? null;
  }, [data, f, metaDetails]);

  /** ✅ parkingType도 여러 소스에서 안전하게 합쳐서 사용 */
  const parkingTypeResolved = useMemo(() => {
    const fromForm = (f as any)?.parkingType;
    const fromView = (data as any)?.parkingType;
    const fromMetaRoot = (metaDetails as any)?.parkingType;
    const fromRaw = (metaDetails as any)?.raw?.parkingType;

    return fromForm ?? fromView ?? fromMetaRoot ?? fromRaw ?? null;
  }, [f, data, metaDetails]);

  // 🔁 전역 메모 보기 모드 (K&N / R)
  const memoViewMode = useMemoViewMode((s) => s.mode); // "public" | "secret"
  const isPublicMemoMode = memoViewMode === "public";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [onClose]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        document
          ?.querySelector<HTMLButtonElement>("[data-pvm-initial]")
          ?.focus();
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // 배경 클릭 → 닫기 (포털 모드에서만 사용)
  const onDimClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      eat(e);
      onClose();
    },
    [onClose]
  );

  // ✨ 콘텐츠 패널에만 버블 단계 전파 차단 (포털 모드에서만 사용)
  const stopBubble = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const handleClickEdit = useCallback(() => {
    // ✅ 모바일 + 토글 OFF면 수정 진입 막기
    if (!canEditProperty) {
      toast({
        title: "모바일에서 수정이 제한됩니다",
        description: "매물정보 수정은 PC 환경에서만 가능합니다.",
      });
      return;
    }

    const imageCardCounts =
      (f as any).imageCardCounts ??
      (Array.isArray(f.cardsHydrated)
        ? (f.cardsHydrated as any[]).map((c: any[]) => c.length)
        : undefined);

    /** ✅ raw/view가 들어있는 최초 initialForEdit 를 베이스로 쓰되,
     *     view 쪽은 항상 최신 data 로 덮어써서(= merge) 향/개별평수 등 수정값을 반영
     */
    const baseInitial = (initialForEdit as any) ?? {};

    const prevView: Partial<PropertyViewDetails> = {
      // 1) 최초 진입 시 쿼리 결과/부모 prop 으로 만들어진 view
      ...(baseInitial.view ?? {}),
      // 2) 뷰 모달이 지금 보고 있는 최신 data (수정 저장 후의 값들 포함)
      ...(data ?? {}),
    };

    /** ✅ raw 는 그대로 두고, view 에만 이미지/향/개별평수 등을 최신 상태로 덮어쓰기 */
    const editSeed = {
      ...baseInitial,
      view: {
        ...prevView,
        // 이미지(폴더/세로사진)
        imageFolders: f.cardsHydrated ?? undefined,
        verticalImages: f.filesHydrated ?? undefined,
        imageCardCounts,
        // 향 / 면적 / 개별평수 등도 최신 뷰 폼 상태로 덮어쓰기 (혹시라도 누락 방지용)
        aspects: (f as any).aspects,
        exclusiveArea: (f as any).exclusiveArea,
        realArea: (f as any).realArea,
        extraExclusiveAreas: (f as any).extraExclusiveAreas,
        extraRealAreas: (f as any).extraRealAreas,
        baseAreaTitle: (f as any).baseAreaTitleView,
        extraAreaTitles: (f as any).extraAreaTitlesView,
        unitLines: (f as any).unitLines,
      },
    };

    console.log("[PropertyViewModal/ViewStage] editSeed for EditModal", {
      baseInitial,
      data,
      editSeed,
    });

    onRequestEdit(editSeed);
  }, [canEditProperty, toast, f, data, onRequestEdit, initialForEdit]);

  const panelClass = cn(
    "bg-white shadow-xl overflow-hidden flex flex-col",
    "w-screen h-screen max-w-none max-h-none rounded-none",
    "md:w-[1100px] md:max-w-[95vw] md:max-h-[92vh] md:rounded-2xl"
  );

  const positionedPanelClass = cn(
    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    panelClass
  );

  if (loading && !hasData) {
    const panel = (
      <div
        className={asInner ? panelClass : positionedPanelClass}
        {...(!asInner && {
          onMouseDown: stopBubble,
          onPointerDown: stopBubble,
          onKeyDownCapture: (e: React.KeyboardEvent) => {
            if (e.key === "Escape") e.stopPropagation();
          },
        })}
      >
        <LoadingSkeleton onClose={onClose} headingId={headingId} />
      </div>
    );

    if (asInner) {
      return panel;
    }

    return (
      <div
        className="fixed inset-0 z-[99999]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descId}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          onClick={onDimClick}
          aria-label="닫기"
          title="닫기"
        />
        {panel}
      </div>
    );
  }

  const panel = (
    <div
      className={asInner ? panelClass : positionedPanelClass}
      {...(!asInner && {
        onMouseDown: stopBubble,
        onPointerDown: stopBubble,
        onKeyDownCapture: (e: React.KeyboardEvent) => {
          if (e.key === "Escape") e.stopPropagation();
        },
      })}
    >
      {hasData ? (
        <>
          <div className="sticky top-0 z-10 bg-white border-b">
            <HeaderViewContainer
              title={f.title}
              parkingGrade={f.parkingGrade}
              elevator={f.elevator}
              pinKind={f.pinKind}
              headingId={headingId}
              descId={descId}
              ageType={ageType}
              completionDate={
                (data as any)?.completionDate ??
                (f as any)?.completionDate ??
                null
              }
              newYearsThreshold={5}
              // ⭐ rebateText를 헤더로 전달 (뷰데이터 우선, 없으면 폼 값)
              rebateText={rebateTextFromSources}
            />
          </div>

          <div
            className={cn(
              "flex-1 min_h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain",
              "px-4 py-4 md:px-5 md:py-4",
              "grid gap-4 md:gap-6",
              "grid-cols-1 md:grid-cols-[300px_1fr]"
            )}
          >
            <div className="space-y-4">
              <DisplayImagesContainer
                cards={f.cardsHydrated}
                images={f.imagesProp}
                files={f.filesHydrated}
              />
            </div>

            <div className="space-y-4 md:space-y-6">
              <BasicInfoViewContainer
                address={f.address ?? ""}
                officePhone={f.officePhone ?? ""}
                officePhone2={f.officePhone2 ?? ""}
              />
              <NumbersViewContainer
                totalBuildings={f.totalBuildings}
                totalFloors={f.totalFloors}
                totalHouseholds={f.totalHouseholds}
                remainingHouseholds={f.remainingHouseholds}
              />
              <ParkingViewContainer
                parkingType={parkingTypeResolved}
                totalParkingSlots={
                  (f as any).totalParkingSlots ??
                  (data as any)?.totalParkingSlots ??
                  (data as any)?.parkingCount ??
                  undefined
                }
              />
              <CompletionRegistryViewContainer
                completionDate={f.completionDateText}
                registry={f.registry}
                slopeGrade={f.slopeGrade}
                structureGrade={f.structureGrade}
                minRealMoveInCost={(f as any).minRealMoveInCost}
                elevator={
                  // 1순위: 폼 상태에 문자열 "O"/"X"가 있으면 사용
                  (f as any).elevator ??
                  // 2순위: 뷰 데이터에 문자열 elevator 필드가 있으면 사용
                  (data as any)?.elevator ??
                  // 3순위: 서버에서 내려온 boolean hasElevator 사용
                  (data as any)?.hasElevator ??
                  null
                }
              />

              <AspectsViewContainer details={data!} />
              <AreaSetsViewContainer
                exclusiveArea={f.exclusiveArea}
                realArea={f.realArea}
                extraExclusiveAreas={f.extraExclusiveAreas}
                extraRealAreas={f.extraRealAreas}
                baseAreaTitle={f.baseAreaTitleView}
                extraAreaTitles={f.extraAreaTitlesView}
              />
              <StructureLinesListContainer
                lines={f.unitLines}
                units={(f as any).units}
              />
              <OptionsBadgesContainer
                options={f.options}
                optionEtc={f.optionEtc}
              />

              {/* 🔁 전역 토글 상태에 따라 한 종류의 메모만 전달 */}
              <MemosContainer
                publicMemo={isPublicMemoMode ? f.publicMemo : undefined}
                secretMemo={!isPublicMemoMode ? f.secretMemo : undefined}
              />

              {/* 👇 생성자/답사자/수정자 메타 정보 (메모 밑) */}
              <MetaInfoContainer details={metaDetails} />

              <div className="h-16 md:hidden" />
            </div>
          </div>

          <div className="md:static">
            <div
              className={cn(
                "fixed bottom-0 left-0 right-0 z-20 md:relative",
                "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70",
                "border-t",
                "px-4 py-3 md:px-5 md:py-3",
                "flex items-center justify-between",
                "shadow-[0_-4px_10px_-6px_rgba(0,0,0,0.15)] md:shadow-none"
              )}
            >
              <div className="flex gap-2">
                {/* ✅ 모바일 + 토글 OFF면 아예 숨김 */}
                {showEditButton && (
                  <button
                    type="button"
                    onClick={handleClickEdit}
                    data-pvm-initial
                    className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-blue-600 hover:bg-blue-50"
                    aria-label="수정"
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                    수정
                  </button>
                )}

                {/* ✅ 부장 / 팀장만 삭제 버튼 노출 */}
                {canDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting || !data?.id}
                    className={cn(
                      "items-center gap-2 rounded-md border px-3 h-9 text-red-600 hover:bg-red-50 hidden md:inline-flex",
                      deleting && "opacity-60 cursor-not-allowed"
                    )}
                    aria-label="삭제"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "삭제 중…" : "삭제"}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-md border px-3 h-9 hover:bg-muted"
                aria-label="닫기"
                title="닫기"
              >
                닫기
              </button>
            </div>
          </div>
        </>
      ) : (
        <LoadingSkeleton onClose={onClose} headingId={headingId} />
      )}
    </div>
  );

  if (asInner) {
    return panel;
  }

  return (
    <div
      className="fixed inset-0 z-[99999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onDimClick}
        aria-label="닫기"
        title="닫기"
      />
      {panel}
    </div>
  );
}

/* ================= Edit ================= */
function EditStage({
  initialData,
  onClose,
  onSubmit,
  asInner,
}: {
  initialData: PropertyViewDetails | any;
  onClose: () => void;
  onSubmit: (p: UpdatePayload & Partial<CreatePayload>) => void | Promise<void>;
  asInner?: boolean;
}) {
  // asInner는 나중에 PropertyEditModalBody에서 또 쓸 수 있으면 같이 넘겨도 됨
  return (
    <PropertyEditModalBody
      embedded // ✅ 카드 안에서 쓰는 모드
      initialData={initialData}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

/* ================= Loading ================= */
function LoadingSkeleton({
  onClose,
  headingId,
}: {
  onClose: () => void;
  headingId: string;
}) {
  return (
    <>
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 id={headingId} className="text-lg font-semibold">
            상세 정보를 불러오는 중…
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-3 h-9 hover:bg-muted"
            aria-label="닫기"
            title="닫기"
          >
            닫기
          </button>
        </div>
      </div>
      <div className="flex-1 grid place-items-center p-10">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <span className="animate-pulse text-base">
            상세 정보를 불러오는 중…
          </span>
          <div className="h-1.5 w-48 rounded bg-slate-200 overflow-hidden">
            <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] bg-slate-300" />
          </div>
        </div>
      </div>
    </>
  );
}
