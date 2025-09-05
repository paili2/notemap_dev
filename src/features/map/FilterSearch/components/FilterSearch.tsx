"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";

import { FilterSearchProps, FilterState } from "../utils/types";
import { FILTER_OPTIONS, initialFilterState } from "../utils/filterOptions";
import {
  formatNumberWithCommas,
  formatKoreanCurrency,
} from "../utils/formatters";
import { FilterSection } from "./FilterSection";
import { SelectableButton } from "./SelectableButton";
import { PriceInput } from "./PriceInput";
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
    <div className="absolute bottom-4 left-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
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
      <div className="p-3 space-y-6">
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

        {/* 전용 */}
        <FilterSection title="전용">
          <div className="flex gap-2">
            {FILTER_OPTIONS.area.map((area) => (
              <SelectableButton
                key={area}
                label={area}
                isSelected={filters.area === area}
                onClick={() => toggleSelection("area", area)}
              />
            ))}
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
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start">
            <PriceInput
              value={filters.priceMin}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, priceMin: value }))
              }
              placeholder="최소 금액"
              showKoreanCurrency={false}
            />
            <span className="text-gray-500 text-xs px-1 mt-2">~</span>
            <PriceInput
              value={filters.priceMax}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, priceMax: value }))
              }
              placeholder="최대 금액"
              showKoreanCurrency={false}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            <p className="text-xs text-gray-700 truncate">
              {filters.priceMin && filters.priceMin !== "0"
                ? formatKoreanCurrency(filters.priceMin)
                : "0원"}
            </p>
            <span className="text-xs text-gray-700 flex-shrink-0">~</span>
            <p className="text-xs text-gray-700 truncate">
              {filters.priceMax && filters.priceMax !== "0"
                ? formatKoreanCurrency(filters.priceMax)
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
