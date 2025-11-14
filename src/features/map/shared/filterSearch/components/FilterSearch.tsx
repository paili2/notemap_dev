"use client";

import { useEffect, useMemo, useState } from "react";
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

// ⬇️ /pins/search 타입 불러오기
import type { PinSearchParams } from "@/features/pins/types/pin-search";

// ⬇️ 기존 FilterSearchProps를 확장 (타입 파일을 지금 당장 안 고쳐도 되게)
type Props = FilterSearchProps & {
  onApply?: (params: PinSearchParams) => void; // ✅ 상위로 검색 파라미터 전달
  initial?: Partial<FilterState>; // ✅ 이전 값 복구 (옵션)
};

// 평 → ㎡
const PYEONG_TO_M2 = 3.305785;
const toM2 = (s: string) => {
  const n = Number((s ?? "").replaceAll(",", "").trim());
  return Number.isFinite(n) && n >= 0
    ? Math.round(n * PYEONG_TO_M2)
    : undefined;
};

// "있음/없음/전체" → boolean | undefined
const toElevator = (label: string): boolean | undefined => {
  if (!label) return undefined;
  if (label === "있음") return true;
  if (label === "없음") return false;
  return undefined; // "전체" 등
};

// ["1","2","3"] → [1,2,3] (정수/중복/정렬)
const toRooms = (arr: string[]) =>
  Array.from(
    new Set(
      (arr ?? [])
        .map((x) => Number(x))
        .filter((n) => Number.isInteger(n) && n >= 0)
    )
  ).sort((a, b) => a - b);

// 문자열 금액 → number | undefined (0 허용)
const toPrice = (s: string) => {
  const v = convertPriceToWon(s);
  return Number.isFinite(v) ? v : undefined;
};

function buildPinSearchParams(ui: FilterState): PinSearchParams {
  const params: PinSearchParams = {};

  // 1) 방 개수
  const rooms = ui.rooms.map((r) => Number(r)).filter((n) => !isNaN(n));
  if (rooms.length) params.rooms = rooms;

  // 2) 매매가 (문자열 → 숫자)
  const priceMin = Number(ui.priceMin);
  const priceMax = Number(ui.priceMax);
  if (!isNaN(priceMin) && priceMin > 0) params.salePriceMin = priceMin;
  if (!isNaN(priceMax) && priceMax > 0) params.salePriceMax = priceMax;

  // 3) 면적(평 → ㎡)
  const areaMin = Number(ui.areaMin);
  const areaMax = Number(ui.areaMax);
  if (!isNaN(areaMin) && areaMin > 0) {
    params.areaMinM2 = Math.round(areaMin * 3.305785);
  }
  if (!isNaN(areaMax) && areaMax > 0) {
    params.areaMaxM2 = Math.round(areaMax * 3.305785);
  }

  // 4) 엘리베이터
  const elev =
    ui.elevator === "있음" ? true : ui.elevator === "없음" ? false : undefined;
  if (elev !== undefined) {
    params.hasElevator = elev;
  }

  // 5) 건물 유형(등기) - 🔥 여기 부분만 수정
  if (ui.buildingType && ui.buildingType !== "전체") {
    const allowed: PinSearchParams["buildingType"][] = [
      "APT",
      "OP",
      "주택",
      "도생",
      "근생",
    ];

    if (allowed.includes(ui.buildingType as any)) {
      params.buildingType = ui.buildingType as PinSearchParams["buildingType"];
    }
  }

  // 6) 실입주금(필요하면 나중에 추가)

  return params;
}

export default function FilterSearch({
  isOpen,
  onClose,
  onApply,
  initial,
}: Props) {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // 모달 열릴 때 초기값 복구(옵션)
  useEffect(() => {
    if (isOpen && initial) {
      setFilters((prev) => ({ ...prev, ...initial }));
    }
  }, [isOpen, initial]);

  const toggleSelection = (category: keyof FilterState, value: string) => {
    if (category === "rooms") {
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
    const params = buildPinSearchParams(filters); // ✅ 변환
    onApply?.(params); // ✅ 상위로 전달
    onClose(); // 닫기
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
                placeholder="최소 면적(평)"
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
                isSelected={filters.buildingType === building}
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
