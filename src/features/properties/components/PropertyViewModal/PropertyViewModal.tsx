// src/features/properties/components/PropertyViewModal/PropertyViewModal.tsx
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

/* ───────── utils ───────── */
const toUndef = <T,>(v: T | null | undefined): T | undefined => v ?? undefined;
function eat(e: any) {
  try {
    (window as any)?.kakao?.maps?.event?.preventMap?.();
  } catch {}
  if (typeof e?.stopPropagation === "function") e.stopPropagation();
  if (typeof e?.preventDefault === "function") e.preventDefault();
}
function toViewPatchFromEdit(
  p: UpdatePayload & Partial<CreatePayload>
): Partial<PropertyViewDetails> {
  const anyP = p as any;
  return {
    ...(p as any),
    publicMemo: toUndef(anyP.publicMemo),
    secretMemo: toUndef(anyP.secretMemo),
    completionDate: toUndef(anyP.completionDate),
    parkingType: toUndef(anyP.parkingType),
    minRealMoveInCost: toUndef(anyP.minRealMoveInCost),
  };
}

type Stage = "view" | "edit";

/** `editInitial`(서버 원본 DTO)는 내부에서 훅으로 채워주되, 호환을 위해 prop도 허용 */
type ViewDataWithEdit = PropertyViewDetails & { editInitial?: any };

/* ✅ Edit에 넘길 초기데이터 보장 유틸: id 채움 + {raw,view} 래핑 */
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

  // id 보장 (raw.id → view.id → data.id → effectiveId)
  const ensuredId =
    (raw && raw.id) ??
    (view as any)?.id ??
    (data as any)?.id ??
    effectiveId ??
    null;

  const ensuredView =
    ensuredId != null ? { ...(view as any), id: ensuredId } : (view as any);

  // 호출부가 editInitial을 이미 넣었다면 그대로 사용
  const fromProp = (data as any)?.editInitial;
  if (fromProp && (fromProp.view || fromProp.raw)) {
    // 그래도 view.id는 보장해 둔다
    if (fromProp.view && ensuredId != null) {
      fromProp.view = { ...(fromProp.view ?? {}), id: ensuredId };
    }
    return fromProp;
  }

  // 쿼리로 받은 공용 shape가 있으면 그대로
  if (raw || qData?.view) return { raw, view: ensuredView };

  // 마지막: view만 있는 경우 { view }로 포장
  return { view: ensuredView };
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

  /* ───────── React Query: 단일 소스 상세 ───────── */
  const effectiveId =
    pinId ?? (data as any)?.id ?? (data as any)?.propertyId ?? undefined;

  // 모달이 열렸고 id가 있을 때만 fetch
  const q = usePinDetail(effectiveId as any, !!(open && effectiveId));

  /** 뷰에 표시할 데이터: 쿼리의 view가 우선, 없으면 프리필(data) */
  const viewData: PropertyViewDetails | null = useMemo(() => {
    const v = (q.data as any)?.view as PropertyViewDetails | undefined;
    if (v) return v;
    return (data as PropertyViewDetails) ?? null;
  }, [q.data, data]);

  /** 수정 모달에 넘길 원본 DTO (id 보장 + {raw,view} 래핑) */
  const initialForEdit: any | null = useMemo(() => {
    return ensureInitialForEdit({ qData: q.data, data, effectiveId });
  }, [q.data, data, effectiveId]);

  const headingId = "property-view-modal-heading";
  const descId = "property-view-modal-desc";

  /* ───────── 삭제(비활성화) ───────── */
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

  const onEditClose = useCallback(() => setStage("view"), []);
  const onEditSubmit = useCallback(
    async (payload: UpdatePayload & Partial<CreatePayload>) => {
      try {
        const viewPatch = toViewPatchFromEdit(payload);
        await onSave?.(viewPatch);
      } finally {
        setStage("view");
      }
    },
    [onSave]
  );

  if (!open) return null;

  const portalChild =
    stage === "edit" && initialForEdit ? (
      <EditStage
        key={`edit-${String(
          (initialForEdit as any)?.raw?.id ??
            (initialForEdit as any)?.view?.id ??
            idForActions ??
            ""
        )}`}
        initialData={initialForEdit}
        onClose={onEditClose}
        onSubmit={onEditSubmit}
      />
    ) : (
      <ViewStage
        key={`view-${String(idForActions ?? "")}`}
        data={viewData}
        headingId={headingId}
        descId={descId}
        onClose={onClose}
        onClickEdit={() => setStage("edit")}
        onDisable={handleDisable}
        deleting={deleting}
        loading={!!(open && effectiveId && q.isFetching && !viewData)}
      />
    );

  return typeof document !== "undefined"
    ? createPortal(portalChild, document.body)
    : portalChild;
}

/* ================= View 전용 ================= */
function ViewStage({
  data,
  headingId,
  descId,
  onClose,
  onClickEdit,
  onDisable,
  deleting,
  loading,
}: {
  data: PropertyViewDetails | null;
  headingId: string;
  descId: string;
  onClose: () => void;
  onClickEdit: () => void;
  onDisable: () => void;
  deleting: boolean;
  loading?: boolean;
}) {
  const hasData = !!data;
  const formInput = useMemo(
    () => ({ open: true, data: data ?? ({} as PropertyViewDetails) }),
    [data]
  );
  const f = useViewForm(formInput);

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

  const onDimClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      eat(e);
      onClose();
    },
    [onClose]
  );

  const onContentPointerDown = useCallback((e: React.PointerEvent) => {
    eat(e);
  }, []);

  if (loading && !hasData) {
    return (
      <div
        className="fixed inset-0 z-[99999]"
        onPointerDownCapture={onContentPointerDown}
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
      onPointerDownCapture={onContentPointerDown}
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
                onClose={onClose}
                headingId={headingId}
                descId={descId}
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
                {/* 최신 viewData 기준 전달 필요 → 이 스코프의 최신 값은 data */}
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
                    onClick={onClickEdit}
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

/* ================= Edit 전용 ================= */
function EditStage({
  initialData,
  onClose,
  onSubmit,
}: {
  initialData: PropertyViewDetails | any; // editInitial 원본 DTO 허용
  onClose: () => void;
  onSubmit: (p: UpdatePayload & Partial<CreatePayload>) => void | Promise<void>;
}) {
  return (
    <PropertyEditModalBody
      initialData={initialData} // ✅ { raw?, view } 형태 또는 { view }만 와도 OK (Edit 쪽에서 정규화 필요)
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

/* ================= 로딩 ================= */
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
          <div className="h-1.5 w-48 rounded bg-slate-2 00 overflow-hidden">
            <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] bg-slate-300" />
          </div>
        </div>
      </div>
    </>
  );
}
