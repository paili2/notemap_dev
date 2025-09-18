"use client";

import { useState } from "react";
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

export default function PropertyViewModal({
  open,
  onClose,
  data,
  onSave, // ← 저장 콜백을 받아서 edit 모드에서 사용
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  data: PropertyViewDetails;
  onSave?: (patch: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  if (!open || !data) return null;

  const [mode, setMode] = useState<"view" | "edit">("view");
  const f = useViewForm({ open, data });

  // 뷰 모달 공통 껍데기
  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dim */}
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="닫기"
      />

      {/* Wrapper: 모바일 풀스크린 / 데스크탑 카드 */}
      <div
        className={[
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "bg-white shadow-xl overflow-hidden flex flex-col",
          "w-screen h-screen max-w-none max-h-none rounded-none",
          "md:w-[1100px] md:max-w-[95vw] md:max-h-[92vh] md:rounded-2xl",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        {mode === "view" ? (
          <>
            {/* 헤더: 모바일에서 sticky */}
            <div className="sticky top-0 z-10 bg-white border-b">
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
                "grid-cols-1 md:grid-cols-[300px_1fr]",
              ].join(" ")}
            >
              {/* 좌측(모바일 상단): 이미지 */}
              <div className="space-y-4">
                <DisplayImagesContainer
                  cards={f.cardsHydrated}
                  images={f.imagesProp}
                  files={f.filesHydrated}
                />
              </div>

              {/* 우측(모바일 하단): 정보 섹션들 */}
              <div className="space-y-4 md:space-y-6">
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
                <div className="h-16 md:hidden" />
              </div>
            </div>

            {/* 하단 액션: 모바일 고정 바 / 데스크탑은 내부 바 */}
            <div className="md:static">
              <div
                className={[
                  "fixed bottom-0 left-0 right-0 z-20 md:relative",
                  "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70",
                  "border-t",
                  "px-4 py-3 md:px-5 md:py-3",
                  "flex items-center justify-between",
                  "shadow-[0_-4px_10px_-6px_rgba(0,0,0,0.15)] md:shadow-none",
                ].join(" ")}
              >
                <div className="flex gap-2">
                  {/* ✅ onEdit 여부와 무관하게 항상 표시, 내부 모드 토글 */}
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-blue-600 hover:bg-blue-50"
                    aria-label="수정"
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                    수정
                  </button>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("정말 삭제할까요?")) return;
                        await onDelete();
                      }}
                      className="items-center gap-2 rounded-md border px-3 h-9 text-red-600 hover:bg-red-50 hidden md:inline-flex "
                      aria-label="삭제"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
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
          /* ✅ 편집 모드: 같은 모달 프레임 안에서 내용만 교체 */
          <PropertyEditModalBody
            embedded
            initialData={data}
            onClose={() => setMode("view")} // 취소/닫기 → 보기 모드 복귀
            onSubmit={async (payload) => {
              try {
                await onSave?.(payload as any);
              } finally {
                setMode("view"); // 저장 후 보기 모드 복귀
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
