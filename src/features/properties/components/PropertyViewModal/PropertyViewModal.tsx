"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";

import HeaderSectionView from "./components/HeaderSectionView/HeaderSectionView";
import DisplayImagesSection from "./components/DisplayImagesSection/DisplayImagesSection";
import BasicInfoView from "./components/BasicInfoView";
import NumbersView from "./components/NumbersView/NumbersView";
import ParkingView from "./components/ParkingView";
import CompletionRegistryView from "./components/CompletionRegistryView/CompletionRegistryView";
import AspectsView from "./components/AspectsView/AspectsView";
import AreaSetsView from "./components/AreaSetsView/AreaSetsView";
import StructureLinesList from "./components/StructureLinesList";
import OptionsBadges from "./components/OptionsBadges";
import MemoPanel from "./components/MemoPanel";

import { toYMDFlexible } from "@/lib/dateUtils";
import { useViewImagesHydration } from "./hooks/useViewImagesHydration";
import { extractViewMeta } from "./utils/extractViewMeta";
import { MemoTab, PropertyViewDetails } from "./types";

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
  const [memoTab, setMemoTab] = useState<MemoTab>("KN");

  // ✅ 이미지 관련 상태/로직 훅으로 분리
  const { preferCards, cardsHydrated, filesHydrated, legacyImagesHydrated } =
    useViewImagesHydration({ open, data });

  if (!open || !data) return null;

  // preferCards=true면 images를 undefined로 넘겨 카드 렌더 강제
  const imagesProp = preferCards ? undefined : legacyImagesHydrated;

  // ✅ 메타 추출 유틸로 분리
  const { pinKind, baseAreaTitleView, extraAreaTitlesView } = extractViewMeta(
    data as any
  );

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-1/2 top-1/2 w-[1100px] max-w-[95vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
        <HeaderSectionView
          title={data.title ?? ""}
          listingStars={data.listingStars ?? 0}
          elevator={(data.elevator as "O" | "X") ?? "O"}
          pinKind={pinKind}
          onClose={onClose}
        />

        <div className="grid grid-cols-[300px_1fr] gap-6 px-5 py-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <div className="space-y-4">
            <DisplayImagesSection
              cards={cardsHydrated}
              images={imagesProp}
              files={filesHydrated}
            />
          </div>

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
              completionDate={toYMDFlexible(data.completionDate, { utc: true })}
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
              baseAreaTitle={baseAreaTitleView}
              extraAreaTitles={extraAreaTitlesView}
            />
            <StructureLinesList
              lines={Array.isArray(data.unitLines) ? data.unitLines : []}
            />
            <OptionsBadges
              options={data.options ?? []}
              optionEtc={data.optionEtc ?? ""}
            />

            {/* 메모 탭 */}
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
