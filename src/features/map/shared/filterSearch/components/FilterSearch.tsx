"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";

import { FilterSearchProps, FilterState } from "../types/types";
import { FILTER_OPTIONS, initialFilterState } from "../utils/filterOptions";
import {
  formatNumberWithCommas,
  formatKoreanCurrency,
  convertPriceToWon,
} from "../utils/formatters";
import { FilterSection } from "./FilterSection";
import { SelectableButton } from "./SelectableButton";
import { PriceInput } from "./PriceInput";
import { AreaInput } from "./AreaInput";
import { FilterActions } from "./FilterActions";

import type { PinSearchParams } from "@/features/pins/types/pin-search";
import Portal from "@/components/Portal";
import { BuildingType } from "@/features/properties/types/property-domain";

type Props = FilterSearchProps & {
  onApply?: (params: PinSearchParams) => void;
  initial?: Partial<FilterState>;
};

const PYEONG_TO_M2 = 3.305785;
const toM2 = (s: string) => {
  const n = Number((s ?? "").replaceAll(",", "").trim());
  return Number.isFinite(n) && n >= 0
    ? Math.round(n * PYEONG_TO_M2)
    : undefined;
};

function buildPinSearchParams(ui: FilterState): PinSearchParams {
  const params: PinSearchParams = {};

  // 1) 방 개수
  const rooms: number[] = (ui.rooms ?? [])
    .map((label) => {
      const m = label.match(/\d+/);
      return m ? Number(m[0]) : NaN;
    })
    .filter((n, idx, arr) => !Number.isNaN(n) && arr.indexOf(n) === idx);

  if (rooms.length) {
    params.rooms = rooms;
  }

  // 2) 복층 / 테라스
  if (ui.rooms?.includes("복층")) {
    params.hasLoft = true;
  }
  if (ui.rooms?.includes("테라스")) {
    params.hasTerrace = true;
  }

  // ⛔ 실입주금은 아직 서버에서 안 받으니까 주석/삭제
  // const depositAmount = Number(convertPriceToWon(ui.deposit));
  // if (Number.isFinite(depositAmount) && depositAmount > 0) {
  //   (params as any).minRealMoveInCost = depositAmount;
  // }

  // 3) 매매가
  const priceMin = Number(ui.priceMin.replaceAll(",", ""));
  const priceMax = Number(ui.priceMax.replaceAll(",", ""));
  if (!Number.isNaN(priceMin) && priceMin > 0) {
    params.salePriceMin = priceMin;
  }
  if (!Number.isNaN(priceMax) && priceMax > 0) {
    params.salePriceMax = priceMax;
  }

  // 4) 면적
  const areaMin = Number(ui.areaMin.replaceAll(",", ""));
  const areaMax = Number(ui.areaMax.replaceAll(",", ""));
  if (!Number.isNaN(areaMin) && areaMin > 0) {
    params.areaMinM2 = Math.round(areaMin * PYEONG_TO_M2);
  }
  if (!Number.isNaN(areaMax) && areaMax > 0) {
    params.areaMaxM2 = Math.round(areaMax * PYEONG_TO_M2);
  }

  // 5) 엘리베이터
  const elev =
    ui.elevator === "있음" ? true : ui.elevator === "없음" ? false : undefined;
  if (elev !== undefined) {
    params.hasElevator = elev;
  }

  // 6) 건물유형
  if (ui.buildingTypes && ui.buildingTypes.length > 0) {
    const map: Record<string, BuildingType> = {
      주택: "주택",
      APT: "APT",
      OP: "OP",
      "도/생": "도생",
      "근/생": "근생",
    };

    const mapped = ui.buildingTypes
      .map((label) => map[label])
      .filter((v): v is BuildingType => !!v);

    if (mapped.length) {
      (params as any).buildingTypes = Array.from(new Set(mapped));
    }
  }

  return params;
}

export default function FilterSearch({
  isOpen,
  onClose,
  onApply,
  initial,
}: Props) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilterState as FilterState
  );

  // 🔹 모달이 열릴 때만 initial 반영 (isOpen만 의존)
  useEffect(() => {
    if (!isOpen) return;

    if (initial) {
      setFilters((prev) => ({ ...prev, ...initial }));
    } else {
      setFilters(initialFilterState as FilterState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleSelection = (category: keyof FilterState, value: string) => {
    if (category === "rooms" || category === "buildingTypes") {
      const currentArray = (filters[category] as string[]) ?? [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];

      setFilters((prev) => ({ ...prev, [category]: newArray }));
    } else {
      setFilters((prev) => ({ ...prev, [category]: value }));
    }
  };

  const resetFilters = () => {
    setFilters(initialFilterState as FilterState);
  };

  const applyFilters = () => {
    const params = buildPinSearchParams(filters);
    onApply?.(params);
    onClose();
  };

  if (!isOpen) return null;

  const depositWon = convertPriceToWon(filters.deposit);
  const depositLabel =
    filters.deposit && filters.deposit !== "0"
      ? formatKoreanCurrency(depositWon)
      : "0원";

  const areaMinM2 = toM2(filters.areaMin);
  const areaMaxM2 = toM2(filters.areaMax);
  const areaMinLabel = `${formatNumberWithCommas(String(areaMinM2 ?? 0))}㎡`;
  const areaMaxLabel = `${formatNumberWithCommas(String(areaMaxM2 ?? 0))}㎡`;

  const priceMinWon = convertPriceToWon(filters.priceMin);
  const priceMaxWon = convertPriceToWon(filters.priceMax);
  const priceMinLabel =
    filters.priceMin && filters.priceMin !== "0"
      ? formatKoreanCurrency(priceMinWon)
      : "0원";
  const priceMaxLabel =
    filters.priceMax && filters.priceMax !== "0"
      ? formatKoreanCurrency(priceMaxWon)
      : "0원";

  return (
    <Portal>
      {/* 🔹 오버레이(검은 배경) 없이 패널만 띄우는 래퍼 */}
      <div
        className="
          fixed inset-x-0 bottom-0 z-[9998]
          flex justify-center sm:justify-start sm:items-end
          pointer-events-none
        "
      >
        {/* 🔹 실제 필터 카드 */}
        <div
          className="
            pointer-events-auto
            mt-0 w-screen h-screen flex flex-col bg-white overflow-hidden
            sm:mt-0 sm:mb-4 sm:ml-4
            sm:h-auto sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:min-w-[384px]
            sm:rounded-lg sm:border sm:border-gray-200 sm:shadow-xl
          "
          style={{ contain: "layout style" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h1 className="text-base font-semibold text-gray-900">필터 검색</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div
            className="flex-1 p-3 space-y-6 overflow-y-auto"
            style={{ contain: "layout" }}
          >
            {/* 방 */}
            <FilterSection title="방">
              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.rooms.map((room) => (
                  <SelectableButton
                    key={room}
                    label={room}
                    isSelected={filters.rooms.includes(room)}
                    onClick={() => toggleSelection("rooms", room)}
                  />
                ))}
              </div>
            </FilterSection>

            {/* 실입주금 */}
            <FilterSection
              title={
                <div className="flex items-center justify-between gap-2">
                  <span>실입주금</span>
                  <span className="text-xs text-gray-700">{depositLabel}</span>
                </div>
              }
            >
              <PriceInput
                value={filters.deposit}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, deposit: value }))
                }
                placeholder="금액 입력"
                showKoreanCurrency={false}
              />
            </FilterSection>

            {/* 면적 */}
            <FilterSection
              title={
                <div className="flex items-center justify-between gap-2">
                  <span>면적</span>
                  <span className="text-xs text-gray-700">
                    {areaMinLabel} ~ {areaMaxLabel}
                  </span>
                </div>
              }
            >
              <div
                className="flex items-start gap-2"
                style={{ contain: "layout" }}
              >
                <div className="flex-1 min-w-0" style={{ minWidth: "120px" }}>
                  <AreaInput
                    value={filters.areaMin}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, areaMin: value }))
                    }
                    placeholder="최소 면적(평)"
                    showConvertedM2={false}
                  />
                </div>
                <span className="text-gray-500 text-xs px-1 mt-2 flex-shrink-0">
                  ~
                </span>
                <div className="flex-1 min-w-0" style={{ minWidth: "120px" }}>
                  <AreaInput
                    value={filters.areaMax}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, areaMax: value }))
                    }
                    placeholder="최대 면적(평)"
                    showConvertedM2={false}
                  />
                </div>
              </div>
            </FilterSection>

            {/* 등기(건물 유형) */}
            <FilterSection title="등기">
              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.buildingType.map((building) => (
                  <SelectableButton
                    key={building}
                    label={building}
                    isSelected={filters.buildingTypes.includes(building)}
                    onClick={() => toggleSelection("buildingTypes", building)}
                  />
                ))}
              </div>
            </FilterSection>

            {/* 엘리베이터 */}
            <FilterSection title="엘리베이터">
              <div className="flex gap-2">
                {FILTER_OPTIONS.elevator.map((elevator) => (
                  <SelectableButton
                    key={elevator}
                    label={elevator}
                    isSelected={filters.elevator === elevator}
                    onClick={() => toggleSelection("elevator", elevator)}
                  />
                ))}
              </div>
            </FilterSection>

            {/* 매매가 */}
            <FilterSection
              title={
                <div className="flex items-center justify-between gap-2">
                  <span>매매가</span>
                  <span className="text-xs text-gray-700">
                    {priceMinLabel} ~ {priceMaxLabel}
                  </span>
                </div>
              }
            >
              <div
                className="flex items-start gap-2"
                style={{ contain: "layout" }}
              >
                <div className="flex-1 min-w-0" style={{ minWidth: "120px" }}>
                  <PriceInput
                    value={filters.priceMin}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, priceMin: value }))
                    }
                    placeholder="최소 금액"
                    showKoreanCurrency={false}
                  />
                </div>
                <span className="text-gray-500 text-xs px-1 mt-2 flex-shrink-0">
                  ~
                </span>
                <div className="flex-1 min-w-0" style={{ minWidth: "120px" }}>
                  <PriceInput
                    value={filters.priceMax}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, priceMax: value }))
                    }
                    placeholder="최대 금액"
                    showKoreanCurrency={false}
                  />
                </div>
              </div>
            </FilterSection>
          </div>

          {/* Bottom Actions */}
          <FilterActions onReset={resetFilters} onApply={applyFilters} />
        </div>
      </div>
    </Portal>
  );
}
