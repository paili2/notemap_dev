"use client";

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

export default function PropertyViewModal({
  open,
  onClose,
  data,
  onDelete,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  data: PropertyViewDetails;
  onSave?: (patch: Partial<PropertyViewDetails>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onEdit?: () => void | Promise<void>;
}) {
  if (!open || !data) return null;

  // ✅ 뷰 전용 훅: 모든 상태/파생값을 f에 모음
  const f = useViewForm({ open, data });

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        <HeaderViewContainer
          title={f.title}
          listingStars={f.listingStars}
          elevator={f.elevator}
          pinKind={f.pinKind}
          onClose={onClose}
        />

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <div className="space-y-4">
            <DisplayImagesContainer
              cards={f.cardsHydrated}
              images={f.imagesProp}
              files={f.filesHydrated}
            />
          </div>

          <div className="space-y-6">
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
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="px-5 py-3 border-t flex items-center justify-between">
          <div className="flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={async () => {
                  await onEdit();
                }}
                className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-blue-600 hover:bg-blue-50"
                aria-label="수정"
                title="수정"
              >
                <Pencil className="h-4 w-4" />
                수정
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("정말 삭제할까요?")) return;
                  await onDelete();
                }}
                className="inline-flex items-center gap-2 rounded-md border px-3 h-9 text-red-600 hover:bg-red-50"
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
    </div>
  );
}
