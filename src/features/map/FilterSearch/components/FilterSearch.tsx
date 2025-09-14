"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";

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

export default function FilterSearch({ isOpen, onClose }: FilterSearchProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  const toggleSelection = (category: keyof FilterState, value: string) => {
    if (category === "rooms" || category === "buildingType") {
      const currentArray = filters[category] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      setFilters((prev) => ({ ...prev, [category]: newArray }));
    } else {
      setFilters((prev) => ({ ...prev, [category]: value }));
    }
  };

  const resetFilters = () => {
    setFilters(initialFilterState);
  };

  const applyFilters = () => {
    console.log("Applying filters:", filters);
    onClose();
    // 필터 적용 로직 구현
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{
        minWidth: "384px",
        contain: "layout style",
      }}
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
      <div className="p-3 space-y-6" style={{ contain: "layout" }}>
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
        <FilterSection title="실입주금">
          <PriceInput
            value={filters.deposit}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, deposit: value }))
            }
            placeholder="금액 입력"
            showKoreanCurrency={true}
          />
        </FilterSection>

        {/* 면적 */}
        <FilterSection title="면적">
          <div className="flex items-start gap-2" style={{ contain: "layout" }}>
            <div className="flex-1 min-w-0" style={{ minWidth: "120px" }}>
              <AreaInput
                value={filters.areaMin}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, areaMin: value }))
                }
                placeholder="최소 면적"
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
                placeholder="최대 면적"
              />
            </div>
          </div>
        </FilterSection>

        {/* 등기 */}
        <FilterSection title="등기">
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.buildingType.map((building) => (
              <SelectableButton
                key={building}
                label={building}
                isSelected={filters.buildingType.includes(building)}
                onClick={() => toggleSelection("buildingType", building)}
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
        <FilterSection title="매매가">
          <div className="flex items-start gap-2" style={{ contain: "layout" }}>
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
          <div className="flex items-center gap-1.5 mt-4">
            <p className="text-xs text-gray-700 truncate">
              {filters.priceMin && filters.priceMin !== "0"
                ? formatKoreanCurrency(convertPriceToWon(filters.priceMin))
                : "0원"}
            </p>
            <span className="text-xs text-gray-700 flex-shrink-0">~</span>
            <p className="text-xs text-gray-700 truncate">
              {filters.priceMax && filters.priceMax !== "0"
                ? formatKoreanCurrency(convertPriceToWon(filters.priceMax))
                : "0원"}
            </p>
          </div>
        </FilterSection>
      </div>

      {/* Bottom Actions */}
      <FilterActions onReset={resetFilters} onApply={applyFilters} />
    </div>
  );
}
