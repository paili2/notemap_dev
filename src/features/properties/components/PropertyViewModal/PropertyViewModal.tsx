"use client";

import { useEffect, useRef, KeyboardEvent } from "react";
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

type Props = {
  open: boolean;
  onClose: () => void;
  data: PropertyViewDetails;
  onSave?: (patch: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onEdit?: () => void | Promise<void>;
};

export default function PropertyViewModal({
  open,
  onClose,
  data,
  onDelete,
  onEdit,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);

  // Early-out
  if (!open || !data) return null;

  const f = useViewForm({ open, data });

  // Body scroll lock (모바일에서 배경 스크롤 방지)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 키보드 핸들링 (Esc로 닫기)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };

  // 모달 열릴 때 포커스 이동 (접근성)
  useEffect(() => {
    if (open) {
      firstBtnRef.current?.focus();
    }
  }, [open]);

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="presentation"
      aria-hidden={!open}
    >
      {/* Dim */}
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="닫기"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="매물 상세 보기"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={[
          // 위치
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          // 배경/레이아웃
          "bg-white shadow-xl overflow-hidden flex flex-col",
          // 모바일: 풀스크린 + 안전영역 대응
          "w-screen h-screen max-w-none max-h-none rounded-none",
          // 데스크탑(md↑): 카드형
          "md:w-[1100px] md:max-w-[95vw] md:max-h-[92vh] md:rounded-2xl",
        ].join(" ")}
        // iOS 홈바 안전영역 보정
        style={{
          // 데스크탑에는 영향 없음. 모바일에서만 의미.
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* 헤더: sticky (모바일에서 상단 고정) */}
        <div className="sticky top-0 z-10 bg-white/95 supports-[backdrop-filter]:bg-white/70 backdrop-blur border-b">
          <HeaderViewContainer
            title={f.title}
            listingStars={f.listingStars}
            elevator={f.elevator}
            pinKind={f.pinKind}
            onClose={onClose}
          />
        </div>

        {/* 본문: 모바일 1열, 데스크탑 2열 */}
        <div
          className={[
            "flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain",
            "px-4 py-4 md:px-5 md:py-4",
            "grid gap-4 md:gap-6",
            "grid-cols-1 md:grid-cols-[320px_1fr]",
          ].join(" ")}
        >
          {/* 좌: 이미지 (모바일 상단) */}
          <section className="space-y-4">
            <DisplayImagesContainer
              cards={f.cardsHydrated}
              images={f.imagesProp}
              files={f.filesHydrated}
            />
          </section>

          {/* 우: 상세 정보 (모바일 하단) */}
          <section className="space-y-4 md:space-y-6">
            <BasicInfoViewContainer
              address={f.address}
              officePhone={f.officePhone}
              officePhone2={f.officePhone2}
            />

            <NumbersViewContainer
              totalBuildings={f.totalBuildings}
              totalFloors={f.totalFloors}
              totalHouseholds={f.totalHouseholds}
              remainingHouseholds={f.remainingHouseholds}
            />

            <ParkingViewContainer
              parkingType={f.parkingType}
              parkingCount={f.parkingCount}
            />

            <CompletionRegistryViewContainer
              completionDate={f.completionDateText}
              salePrice={f.salePrice}
              registry={f.registry}
              slopeGrade={f.slopeGrade}
              structureGrade={f.structureGrade}
            />

            {/* Aspects는 원본 data를 그대로 필요로 하므로 유지 */}
            <AspectsViewContainer details={data} />

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

            {/* 모바일 하단 고정 바에 가려지지 않게 여유 공간 확보 */}
            <div className="h-20 md:hidden" />
          </section>
        </div>

        {/* 하단 액션바 */}
        <div className="md:static">
          <div
            className={[
              // 모바일: 화면 하단 고정
              "fixed bottom-0 left-0 right-0 z-20 md:relative",
              "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70",
              "border-t",
              "px-4 py-3 md:px-5 md:py-3",
              "flex items-center justify-between gap-2",
              "shadow-[0_-8px_16px_-10px_rgba(0,0,0,0.2)] md:shadow-none",
            ].join(" ")}
            // iOS 홈바 안전영역 보정
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
          >
            <div className="flex gap-2">
              {onEdit && (
                <button
                  ref={firstBtnRef}
                  type="button"
                  onClick={async () => {
                    await onEdit();
                  }}
                  className={[
                    "inline-flex items-center justify-center gap-2",
                    "rounded-md border h-11 md:h-9 px-4 md:px-3",
                    "text-blue-600 hover:bg-blue-50",
                    "active:scale-[0.98] transition",
                  ].join(" ")}
                  aria-label="수정"
                  title="수정"
                >
                  <Pencil className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="text-base md:text-sm">수정</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("정말 삭제할까요?")) return;
                    await onDelete();
                  }}
                  className={[
                    "inline-flex items-center justify-center gap-2",
                    "rounded-md border h-11 md:h-9 px-4 md:px-3",
                    "text-red-600 hover:bg-red-50",
                    "active:scale-[0.98] transition",
                  ].join(" ")}
                  aria-label="삭제"
                  title="삭제"
                >
                  <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="text-base md:text-sm">삭제</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className={[
                "inline-flex items-center justify-center gap-2",
                "rounded-md border h-11 md:h-9 px-5 md:px-3",
                "hover:bg-muted active:scale-[0.98] transition",
              ].join(" ")}
              aria-label="닫기"
              title="닫기"
            >
              <span className="text-base md:text-sm">닫기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
