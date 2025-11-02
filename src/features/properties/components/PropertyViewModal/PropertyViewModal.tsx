"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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

/* 🔗 비활성화 API */
import { togglePinDisabled } from "@/shared/api/pins";

/* ───────── null → undefined 보정 ───────── */
const toUndef = <T,>(v: T | null | undefined): T | undefined => v ?? undefined;

/* 지도 이벤트(카카오맵) 누수 방지 */
function eat(e: any) {
  try {
    (window as any)?.kakao?.maps?.event?.preventMap?.();
  } catch {}
  if (typeof e?.stopPropagation === "function") e.stopPropagation();
  if (typeof e?.preventDefault === "function") e.preventDefault();
}

/* ───────── EditPayload → ViewPatch 어댑터 ───────── */
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
    // 신규 필드도 넘어오면 반영(무시해도 무관하지만 안전망)
    minRealMoveInCost: toUndef(anyP.minRealMoveInCost),
  };
}

/**
 * 훅을 항상 같은 순서로 호출하기 위해 data가 없을 때도
 * 안전한 더미 객체를 만들어 넣습니다.
 */
const EMPTY_VIEW: PropertyViewDetails = {} as unknown as PropertyViewDetails;

export default function PropertyViewModal({
  open,
  onClose,
  data,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  /** 로딩 동안 null 허용 */
  data?: PropertyViewDetails | null;
  onSave?: (patch: Partial<PropertyViewDetails>) => void | Promise<void>;
  /** 삭제 클릭 시 후처리가 필요하면 콜백을 넘겨 주세요(리스트 갱신 등). */
  onDelete?: () => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deleting, setDeleting] = useState(false);

  // 포커스/키보드 트랩용
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const firstTrapRef = useRef<HTMLSpanElement | null>(null);
  const lastTrapRef = useRef<HTMLSpanElement | null>(null);
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);

  // 배경 스크롤 잠금
  useBodyScrollLock(open);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [open, onClose]);

  // 최초 포커스 이동 (mode 바뀔 때도 최초 버튼에 포커스)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open, mode]);

  // 탭 포커스 트랩
  const onFocusTrap = useCallback((e: React.FocusEvent) => {
    if (!wrapperRef.current) return;
    const focusable = wrapperRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.target === firstTrapRef.current) {
      last.focus();
    } else if (e.target === lastTrapRef.current) {
      first.focus();
    }
  }, []);

  // 바깥(Dim) 클릭으로 닫기
  const onDimClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      eat(e);
      onClose();
    },
    [onClose]
  );

  // 콘텐츠 내부 포인터 이벤트 누수 방지
  const onContentPointerDown = useCallback((e: React.PointerEvent) => {
    eat(e);
  }, []);

  // 삭제(=비활성화) 처리
  const handleDisable = useCallback(async () => {
    if (!data?.id || deleting) return;
    if (!confirm("정말 삭제(비활성화)할까요?")) return;

    try {
      setDeleting(true);
      await togglePinDisabled(String(data.id), true);
      // 선택: 부모에서 목록/상세 갱신
      await onDelete?.();
      onClose();
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.responseData?.message ||
        "비활성화 요청에 실패했습니다.";
      // eslint-disable-next-line no-alert
      alert(msg);
    } finally {
      setDeleting(false);
    }
  }, [data?.id, deleting, onDelete, onClose]);

  if (!open) return null;

  const hasData = !!data;
  const headingId = "property-view-modal-heading";
  const descId = "property-view-modal-desc";

  /** 훅은 항상 호출 (빈 더미를 넣어 순서 보장) */
  const formInput = useMemo(
    () => ({ open, data: (data ?? EMPTY_VIEW) as PropertyViewDetails }),
    [open, data]
  );
  const f = useViewForm(formInput);

  const node = (
    <div
      className="fixed inset-0 z-[99999]"
      onPointerDownCapture={onContentPointerDown}
    >
      {/* Dim */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onDimClick}
        aria-label="닫기"
      />

      {/* Wrapper: 모바일 풀스크린 / 데스크탑 카드 */}
      <div
        ref={wrapperRef}
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "bg-white shadow-xl overflow-hidden flex flex-col",
          "w-screen h-screen max-w-none max-h-none rounded-none",
          "md:w-[1100px] md:max-w-[95vw] md:max-h-[92vh] md:rounded-2xl"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descId}
        onKeyDownCapture={(e) => {
          if (e.key === "Escape") e.stopPropagation();
        }}
      >
        {/* 포커스 트랩 시작 */}
        <span ref={firstTrapRef} tabIndex={0} onFocus={onFocusTrap} />

        {mode === "view" ? (
          hasData ? (
            <>
              {/* 헤더 */}
              <div className="sticky top-0 z-10 bg-white border-b">
                <HeaderViewContainer
                  title={f.title}
                  /* ⭐ listingStars → parkingGrade 로 변경 */
                  parkingGrade={f.parkingGrade}
                  elevator={f.elevator}
                  pinKind={f.pinKind}
                  onClose={onClose}
                  closeButtonRef={initialFocusRef}
                  headingId={headingId}
                  descId={descId}
                />
              </div>

              {/* 본문 */}
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
                  {/* 방위/면적은 서버 값 → 어댑터 → useViewForm → 여기로 */}
                  <AspectsViewContainer details={data!} />
                  <AreaSetsViewContainer
                    exclusiveArea={f.exclusiveArea}
                    realArea={f.realArea}
                    extraExclusiveAreas={f.extraExclusiveAreas}
                    extraRealAreas={f.extraRealAreas}
                    baseAreaTitle={f.baseAreaTitleView}
                    extraAreaTitles={f.extraAreaTitlesView}
                  />
                  <StructureLinesListContainer lines={f.unitLines} />
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

              {/* 하단 액션 */}
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
                      onClick={() => setMode("edit")}
                      ref={initialFocusRef}
                      className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-blue-600 hover:bg-blue-50"
                      aria-label="수정"
                      title="수정"
                    >
                      <Pencil className="h-4 w-4" />
                      수정
                    </button>

                    {/* 삭제 → 비활성화 */}
                    <button
                      type="button"
                      onClick={handleDisable}
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
            // 데이터 없을 때 로딩 화면
            <>
              <div className="sticky top-0 z-10 bg-white border-b">
                <div className="flex items-center justify-between px-4 py-3">
                  <h2 id={headingId} className="text-lg font-semibold">
                    상세 정보를 불러오는 중…
                  </h2>
                  <button
                    type="button"
                    ref={initialFocusRef}
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
          )
        ) : (
          // 편집 모드 (hasData일 때만 렌더)
          hasData && (
            <PropertyEditModalBody
              key={String(data!.id ?? "edit")}
              embedded
              initialData={data!}
              onClose={() => setMode("view")}
              onSubmit={async (
                payload: UpdatePayload & Partial<CreatePayload>
              ) => {
                try {
                  const viewPatch = toViewPatchFromEdit(payload);
                  await onSave?.(viewPatch);
                } finally {
                  setMode("view");
                }
              }}
            />
          )
        )}

        {/* 포커스 트랩 끝 */}
        <span ref={lastTrapRef} tabIndex={0} onFocus={onFocusTrap} />
      </div>
    </div>
  );

  // 포털로 최상위에 렌더
  if (typeof document !== "undefined") {
    return createPortal(node, document.body);
  }
  return node;
}
