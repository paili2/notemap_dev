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

import Portal from "@/components/Portal";

// 🔹 분리한 유틸/빌더 import
import { validateRangeLabel, toM2 } from "../lib/filterValidators";
import { buildPinSearchParams } from "../lib/buildPinSearchParams";

import { useToast } from "@/hooks/use-toast";

export default function FilterSearch({
  isOpen,
  onClose,
  onApply,
  onClear,
  initial,
}: FilterSearchProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilterState as FilterState
  );
  const { toast } = useToast();

  // 모달 열릴 때만 initial 반영
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
    onClear?.();
  };

  const applyFilters = () => {
    // 1) 범위 검증
    const areaError = validateRangeLabel(
      "면적",
      filters.areaMin,
      filters.areaMax
    );
    const priceError = validateRangeLabel(
      "매매가",
      filters.priceMin,
      filters.priceMax
    );
    const message = areaError ?? priceError;

    if (message) {
      toast({
        variant: "destructive",
        title: "입력값을 확인해 주세요",
        description: message,
      });
      return;
    }

    // 2) 검증 통과 시 검색 파라미터 빌드 + onApply
    const params = buildPinSearchParams(filters);
    onApply?.(params);
    onClose();
  };

  // ---------- 표시용 라벨 계산 ----------
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

  if (!isOpen) return null;

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    (e.nativeEvent as any)?.stopImmediatePropagation?.();
  };

  return (
    <Portal>
      <div
        id="filter-search-root"
        className="
          fixed inset-x-0 bottom-0 z-[9998]
          flex justify-center sm:justify-start sm:items-end
          pointer-events-none
        "
      >
        <div
          className="
            pointer-events-auto
            mt-0 w-screen h-screen flex flex-col bg-white overflow-hidden
            sm:mt-0 sm:mb-4 sm:ml-4
            sm:h-auto sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:min-w-[384px]
            sm:rounded-lg sm:border sm:border-gray-200 sm:shadow-xl
          "
          style={{ contain: "layout style" }}
          onMouseDown={stop}
          onClick={stop}
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
