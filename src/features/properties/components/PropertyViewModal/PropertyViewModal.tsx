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

import PropertyEditModalBody from "@/features/properties/components/PropertyEditModal/PropertyEditModalBody";
import { CreatePayload, UpdatePayload } from "../../types/property-dto";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { togglePinDisabled } from "@/shared/api/pins";
import { usePinDetail } from "../../hooks/useEditForm/usePinDetail";
import MetaInfoContainer from "./components/MetaInfoContainer";

/* utils */
const toUndef = <T,>(v: T | null | undefined): T | undefined => v ?? undefined;

// 지도 이벤트만 막고 기본 클릭은 그대로 두기
function eat(e: any) {
  try {
    (window as any)?.kakao?.maps?.event?.preventMap?.();
  } catch {}
}

/** ✅ 로컬 뷰 동기화용 패치에 isNew/isOld 반영 추가 */
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

  // 서버로 보낸 토글이 있다면 그대로 반영
  if ("isNew" in anyP) patch.isNew = anyP.isNew;
  if ("isOld" in anyP) patch.isOld = anyP.isOld;

  // 헤더에서 buildingGrade만 넘어온 경우도 커버
  if ("buildingGrade" in anyP && anyP.buildingGrade) {
    patch.isNew = String(anyP.buildingGrade).toLowerCase() === "new";
    patch.isOld = String(anyP.buildingGrade).toLowerCase() === "old";
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

/* === 연식 플래그 유도 유틸 === */
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

/** ✅ 우선순위: isNew/isOld → buildingAgeType → buildingGrade(레거시) */
function deriveAgeFlagsFrom(src: any): { isNew: boolean; isOld: boolean } {
  const nIsNew = normalizeBoolLoose(src?.isNew);
  const nIsOld = normalizeBoolLoose(src?.isOld);

  if (nIsNew === true && nIsOld !== true) return { isNew: true, isOld: false };
  if (nIsOld === true && nIsNew !== true) return { isNew: false, isOld: true };

  const t = (src?.buildingAgeType ?? "").toString().toUpperCase();
  if (t === "NEW") return { isNew: true, isOld: false };
  if (t === "OLD") return { isNew: false, isOld: true };

  const g = (src?.buildingGrade ?? "").toString().toLowerCase();
  if (g === "new") return { isNew: true, isOld: false };
  if (g === "old") return { isNew: false, isOld: true };

  // 4) 아무 정보 없으면 기본값(신축)
  return { isNew: true, isOld: false };
}

export default function PropertyViewModal({
  open,
  onClose,
  data,
  pinId,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  data?: ViewDataWithEdit | null;
  pinId?: string | number | null;
  onSave?: (patch: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  const [stage, setStage] = useState<Stage>("view");
  const [deleting, setDeleting] = useState(false);
  useBodyScrollLock(open);

  const [editInitial, setEditInitial] = useState<any | null>(null);

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

  const handleDisable = useCallback(async () => {
    if (!idForActions || deleting) return;
    if (!confirm("정말 삭제(비활성화)할까요?")) return;
    try {
      setDeleting(true);
      await togglePinDisabled(String(idForActions), true);
      await onDelete?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.responseData?.message ||
        "비활성화 요청에 실패했습니다.";
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
      try {
        const viewPatch = toViewPatchFromEdit(payload);
        await onSave?.(viewPatch);
      } finally {
        setStage("view");
        setEditInitial(null);
      }
    },
    [onSave]
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
      />
    ) : (
      <ViewStage
        key={`view-${String(idForActions ?? "")}`}
        data={viewData}
        metaDetails={metaDetails}
        headingId={headingId}
        descId={descId}
        onClose={onClose}
        onDisable={handleDisable}
        deleting={deleting}
        loading={!!(open && effectiveId && q.isFetching && !viewData)}
        onRequestEdit={(seed) => {
          setEditInitial(seed);
          setStage("edit");
        }}
        onClickEdit={() => {}}
      />
    );

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
  onDisable,
  deleting,
  loading,
  onRequestEdit,
}: {
  data: PropertyViewDetails | null;
  metaDetails: any;
  headingId: string;
  descId: string;
  onClose: () => void;
  onClickEdit: () => void;
  onDisable: () => void;
  deleting: boolean;
  loading?: boolean;
  onRequestEdit: (seed: any) => void;
}) {
  console.log("[PropertyViewModal/ViewStage] render", { data });
  const hasData = !!data;
  const formInput = useMemo(
    () => ({ open: true, data: data ?? ({} as PropertyViewDetails) }),
    [data]
  );
  const f = useViewForm(formInput);

  const ageFlags = useMemo(() => {
    const src = { ...(data as any), ...(f as any) };
    const resolved = deriveAgeFlagsFrom(src);

    console.log("[PropertyViewModal/ViewStage] age flags", {
      src,
      resolved,
    });

    return resolved;
  }, [data, f]);

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

  // 배경 클릭 → 닫기
  const onDimClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      eat(e);
      onClose();
    },
    [onClose]
  );

  // ✨ 콘텐츠 패널에만 버블 단계 전파 차단
  const stopBubble = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const handleClickEdit = useCallback(() => {
    const imageCardCounts =
      (f as any).imageCardCounts ??
      (Array.isArray(f.cardsHydrated)
        ? (f.cardsHydrated as any[]).map((c: any[]) => c.length)
        : undefined);

    const editSeed = {
      view: {
        ...(data ?? {}),
        imageFolders: f.cardsHydrated ?? undefined,
        verticalImages: f.filesHydrated ?? undefined,
        imageCardCounts,
      },
    };

    onRequestEdit(editSeed);
  }, [data, f, onRequestEdit]);

  if (loading && !hasData) {
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
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "bg-white shadow-xl overflow-hidden flex flex-col",
            "w-screen h-screen max-w-none max-h-none rounded-none",
            "md:w-[1100px] md:max-w-[95vw] md:max-h-[92vh] md:rounded-2xl"
          )}
          onMouseDown={stopBubble}
          onPointerDown={stopBubble}
          onKeyDownCapture={(e) => {
            if (e.key === "Escape") e.stopPropagation();
          }}
        >
          <LoadingSkeleton onClose={onClose} headingId={headingId} />
        </div>
      </div>
    );
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
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "bg-white shadow-xl overflow-hidden flex flex-col",
          "w-screen h-screen max-w-none max-h-none rounded-none",
          "md:w-[1100px] md:max-w-[95vw] md:max-h-[92vh] md:rounded-2xl"
        )}
        onMouseDown={stopBubble}
        onPointerDown={stopBubble}
        onKeyDownCapture={(e) => {
          if (e.key === "Escape") e.stopPropagation();
        }}
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
                isNew={ageFlags.isNew}
                isOld={ageFlags.isOld}
                buildingAgeType={(data as any)?.buildingAgeType ?? undefined}
                completionDate={
                  (data as any)?.completionDate ??
                  (f as any)?.completionDate ??
                  null
                }
                newYearsThreshold={5}
              />
            </div>

            <div
              className={cn(
                "flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain",
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
                  parkingType={f.parkingType}
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
                <MemosContainer
                  publicMemo={f.publicMemo}
                  secretMemo={f.secretMemo}
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

                  <button
                    type="button"
                    onClick={onDisable}
                    disabled={deleting || !data?.id}
                    className={cn(
                      "items-center gap-2 rounded-md border px-3 h-9 text-red-600 hover:bg-red-50 hidden md:inline-flex",
                      deleting && "opacity-60 cursor-not-allowed"
                    )}
                    aria-label="삭제"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "비활성화 중…" : "삭제"}
                  </button>
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
    </div>
  );
}

/* ================= Edit ================= */
function EditStage({
  initialData,
  onClose,
  onSubmit,
}: {
  initialData: PropertyViewDetails | any;
  onClose: () => void;
  onSubmit: (p: UpdatePayload & Partial<CreatePayload>) => void | Promise<void>;
}) {
  return (
    <PropertyEditModalBody
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
