"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import type { PropertyViewDetails } from "@/features/properties/types/property-view";

import HeaderSectionView from "./view/HeaderSectionView";
import DisplayImagesSection from "./view/DisplayImagesSection";
import BasicInfoView from "./view/BasicInfoView";
import NumbersView from "./view/NumbersView";
import ParkingView from "./view/ParkingView";
import CompletionRegistryView from "./view/CompletionRegistryView";
import AspectsView from "./view/AspectsView";
import AreaSetsView from "./view/AreaSetsView";
import StructureLinesList from "./view/StructureLinesList";
import OptionsBadges from "./view/OptionsBadges";
import MemoPanel from "./view/MemoPanel";

type MemoTab = "KN" | "R";

const toYMD = (
  v: string | Date | null | undefined
): string | null | undefined => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v ?? null;
};

export default function PropertyViewModal({
  open,
  onClose,
  data,
  onSave,
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

  const [memoTab, setMemoTab] = useState<MemoTab>("KN");

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <HeaderSectionView
          title={data.title ?? ""}
          listingStars={data.listingStars ?? 0}
          elevator={(data.elevator as "O" | "X") ?? "O"}
          onClose={onClose}
        />

        {/* 본문 */}
        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          {/* 좌: 이미지 카드 */}
          {(() => {
            const imageCards = Array.isArray((data as any).imageCards)
              ? (data as any).imageCards
              : undefined;
            const fileItems = Array.isArray((data as any).fileItems)
              ? (data as any).fileItems
              : undefined;
            const legacyImages = Array.isArray((data as any).images)
              ? (data as any).images
              : undefined;

            const cardGroups = imageCards;

            return (
              <div className="space-y-4">
                <DisplayImagesSection
                  cards={cardGroups}
                  images={legacyImages}
                  files={fileItems}
                />
              </div>
            );
          })()}

          {/* 우: 상세 정보 */}
          <div className="space-y-6">
            <BasicInfoView
              address={data.address ?? ""}
              officePhone={data.officePhone ?? ""}
              officePhone2={data.officePhone2 ?? ""}
            />

            <NumbersView
              totalBuildings={data.totalBuildings}
              totalFloors={data.totalFloors}
              totalHouseholds={data.totalHouseholds}
              remainingHouseholds={data.remainingHouseholds}
            />

            <ParkingView
              parkingType={data.parkingType ?? ""}
              parkingCount={data.parkingCount}
            />

            <CompletionRegistryView
              completionDate={toYMD(data.completionDate)}
              salePrice={data.salePrice}
              registry={data.registry}
              slopeGrade={data.slopeGrade}
              structureGrade={data.structureGrade}
            />

            <AspectsView details={data} />

            <AreaSetsView
              exclusiveArea={data.exclusiveArea}
              realArea={data.realArea}
              extraExclusiveAreas={data.extraExclusiveAreas}
              extraRealAreas={data.extraRealAreas}
            />

            <StructureLinesList
              lines={Array.isArray(data.unitLines) ? data.unitLines : []}
            />

            <OptionsBadges
              options={data.options ?? []}
              optionEtc={data.optionEtc ?? ""}
            />

            {/* 메모 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">메모</div>
                <div className="inline-flex rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMemoTab("KN")}
                    className={`px-3 h-8 text-sm ${
                      memoTab === "KN"
                        ? "bg-amber-500 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    K&N
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoTab("R")}
                    className={`px-3 h-8 text-sm border-l ${
                      memoTab === "R"
                        ? "bg-rose-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    R
                  </button>
                </div>
              </div>

              {memoTab === "KN" ? (
                <MemoPanel mode="KN" value={data.publicMemo ?? ""} />
              ) : (
                <MemoPanel mode="R" value={data.secretMemo ?? ""} />
              )}
            </div>
          </div>
        </div>

        {/* 하단: 수정/삭제/닫기 */}
        <div className="px-5 py-3 border-t flex items-center justify-between">
          <div className="flex gap-2">
            {/* ✅ 수정: onEdit 있을 때만, 삭제 왼쪽에 */}
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

            {/* 삭제: onDelete 있을 때만 */}
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
