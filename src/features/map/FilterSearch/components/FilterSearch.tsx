"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";

// 타입 정의
interface FilterState {
  rooms: string[];
  deposit: string;
  area: string;
  buildingType: string[];
  elevator: string;
  priceMin: string;
  priceMax: string;
}

// 옵션 상수
const FILTER_OPTIONS = {
  rooms: ["1룸", "1.5룸", "2룸", "3룸", "4룸", "복층", "테라스"],
  area: ["17평 이하", "17평 이상"],
  buildingType: ["주택", "APT", "OP", "도/생", "근/생"],
  elevator: ["있음", "없음"],
} as const;

// 초기 필터 상태
const initialFilterState: FilterState = {
  rooms: [],
  deposit: "",
  area: "",
  buildingType: [],
  elevator: "",
  priceMin: "",
  priceMax: "",
};

// 필터 섹션 컴포넌트
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FilterSection = ({ title, children }: FilterSectionProps) => (
  <div>
    <h2 className="text-sm font-medium text-gray-900 mb-3">{title}</h2>
    {children}
  </div>
);

// 선택 가능한 버튼 컴포넌트
interface SelectableButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const SelectableButton = ({
  label,
  isSelected,
  onClick,
}: SelectableButtonProps) => (
  <Button
    variant={isSelected ? "default" : "outline"}
    size="sm"
    className={`text-xs border-2 ${
      isSelected
        ? "bg-gray-900 text-white hover:bg-gray-800 border-gray-900"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`}
    onClick={onClick}
  >
    {label}
  </Button>
);

// 숫자에 천 단위 구분자 추가하는 함수
const formatNumberWithCommas = (value: string): string => {
  // 숫자가 아닌 문자 제거
  const numericValue = value.replace(/[^0-9]/g, "");
  if (numericValue === "") return "";

  // 천 단위 구분자 추가
  return Number(numericValue).toLocaleString();
};

// 숫자를 한국어 단위로 변환하는 함수
const formatKoreanCurrency = (value: string): string => {
  const num = Number(value.replace(/,/g, ""));
  if (isNaN(num) || num === 0) return "";

  let result = "";

  // 억 단위
  if (num >= 100000000) {
    const billion = Math.floor(num / 100000000);
    result += `${billion}억`;
    const remainder = num % 100000000;
    if (remainder > 0) {
      result += " ";
      if (remainder >= 10000) {
        const million = Math.floor(remainder / 10000);
        result += `${million}만`;
        const thousandRemainder = remainder % 10000;
        if (thousandRemainder > 0) {
          result += " ";
          if (thousandRemainder >= 1000) {
            const thousand = Math.floor(thousandRemainder / 1000);
            result += `${thousand}천`;
            const hundredRemainder = thousandRemainder % 1000;
            if (hundredRemainder > 0) {
              result += " ";
              if (hundredRemainder >= 100) {
                const hundred = Math.floor(hundredRemainder / 100);
                result += `${hundred}백`;
                const tenRemainder = hundredRemainder % 100;
                if (tenRemainder > 0) {
                  result += " ";
                  if (tenRemainder >= 10) {
                    const ten = Math.floor(tenRemainder / 10);
                    result += `${ten}십`;
                    const one = tenRemainder % 10;
                    if (one > 0) {
                      result += ` ${one}`;
                    }
                  } else {
                    result += `${tenRemainder}`;
                  }
                }
              } else if (hundredRemainder >= 10) {
                const ten = Math.floor(hundredRemainder / 10);
                result += `${ten}십`;
                const one = hundredRemainder % 10;
                if (one > 0) {
                  result += ` ${one}`;
                }
              } else {
                result += `${hundredRemainder}`;
              }
            }
          } else if (thousandRemainder >= 100) {
            const hundred = Math.floor(thousandRemainder / 100);
            result += `${hundred}백`;
            const tenRemainder = thousandRemainder % 100;
            if (tenRemainder > 0) {
              result += " ";
              if (tenRemainder >= 10) {
                const ten = Math.floor(tenRemainder / 10);
                result += `${ten}십`;
                const one = tenRemainder % 10;
                if (one > 0) {
                  result += ` ${one}`;
                }
              } else {
                result += `${tenRemainder}`;
              }
            }
          } else if (thousandRemainder >= 10) {
            const ten = Math.floor(thousandRemainder / 10);
            result += `${ten}십`;
            const one = thousandRemainder % 10;
            if (one > 0) {
              result += ` ${one}`;
            }
          } else {
            result += `${thousandRemainder}`;
          }
        }
      } else if (remainder >= 1000) {
        const thousand = Math.floor(remainder / 1000);
        result += `${thousand}천`;
        const hundredRemainder = remainder % 1000;
        if (hundredRemainder > 0) {
          result += " ";
          if (hundredRemainder >= 100) {
            const hundred = Math.floor(hundredRemainder / 100);
            result += `${hundred}백`;
            const tenRemainder = hundredRemainder % 100;
            if (tenRemainder > 0) {
              result += " ";
              if (tenRemainder >= 10) {
                const ten = Math.floor(tenRemainder / 10);
                result += `${ten}십`;
                const one = tenRemainder % 10;
                if (one > 0) {
                  result += ` ${one}`;
                }
              } else {
                result += `${tenRemainder}`;
              }
            }
          } else if (hundredRemainder >= 10) {
            const ten = Math.floor(hundredRemainder / 10);
            result += `${ten}십`;
            const one = hundredRemainder % 10;
            if (one > 0) {
              result += ` ${one}`;
            }
          } else {
            result += `${hundredRemainder}`;
          }
        }
      } else if (remainder >= 100) {
        const hundred = Math.floor(remainder / 100);
        result += `${hundred}백`;
        const tenRemainder = remainder % 100;
        if (tenRemainder > 0) {
          result += " ";
          if (tenRemainder >= 10) {
            const ten = Math.floor(tenRemainder / 10);
            result += `${ten}십`;
            const one = tenRemainder % 10;
            if (one > 0) {
              result += ` ${one}`;
            }
          } else {
            result += `${tenRemainder}`;
          }
        }
      } else if (remainder >= 10) {
        const ten = Math.floor(remainder / 10);
        result += `${ten}십`;
        const one = remainder % 10;
        if (one > 0) {
          result += ` ${one}`;
        }
      } else {
        result += `${remainder}`;
      }
    }
  } else if (num >= 10000) {
    // 만 단위
    const million = Math.floor(num / 10000);
    result += `${million}만`;
    const remainder = num % 10000;
    if (remainder > 0) {
      result += " ";
      if (remainder >= 1000) {
        const thousand = Math.floor(remainder / 1000);
        result += `${thousand}천`;
        const hundredRemainder = remainder % 1000;
        if (hundredRemainder > 0) {
          result += " ";
          if (hundredRemainder >= 100) {
            const hundred = Math.floor(hundredRemainder / 100);
            result += `${hundred}백`;
            const tenRemainder = hundredRemainder % 100;
            if (tenRemainder > 0) {
              result += " ";
              if (tenRemainder >= 10) {
                const ten = Math.floor(tenRemainder / 10);
                result += `${ten}십`;
                const one = tenRemainder % 10;
                if (one > 0) {
                  result += ` ${one}`;
                }
              } else {
                result += `${tenRemainder}`;
              }
            }
          } else if (hundredRemainder >= 10) {
            const ten = Math.floor(hundredRemainder / 10);
            result += `${ten}십`;
            const one = hundredRemainder % 10;
            if (one > 0) {
              result += ` ${one}`;
            }
          } else {
            result += `${hundredRemainder}`;
          }
        }
      } else if (remainder >= 100) {
        const hundred = Math.floor(remainder / 100);
        result += `${hundred}백`;
        const tenRemainder = remainder % 100;
        if (tenRemainder > 0) {
          result += " ";
          if (tenRemainder >= 10) {
            const ten = Math.floor(tenRemainder / 10);
            result += `${ten}십`;
            const one = tenRemainder % 10;
            if (one > 0) {
              result += ` ${one}`;
            }
          } else {
            result += `${tenRemainder}`;
          }
        }
      } else if (remainder >= 10) {
        const ten = Math.floor(remainder / 10);
        result += `${ten}십`;
        const one = remainder % 10;
        if (one > 0) {
          result += ` ${one}`;
        }
      } else {
        result += `${remainder}`;
      }
    }
  } else if (num >= 1000) {
    // 천 단위
    const thousand = Math.floor(num / 1000);
    result += `${thousand}천`;
    const remainder = num % 1000;
    if (remainder > 0) {
      result += " ";
      if (remainder >= 100) {
        const hundred = Math.floor(remainder / 100);
        result += `${hundred}백`;
        const tenRemainder = remainder % 100;
        if (tenRemainder > 0) {
          result += " ";
          if (tenRemainder >= 10) {
            const ten = Math.floor(tenRemainder / 10);
            result += `${ten}십`;
            const one = tenRemainder % 10;
            if (one > 0) {
              result += ` ${one}`;
            }
          } else {
            result += `${tenRemainder}`;
          }
        }
      } else if (remainder >= 10) {
        const ten = Math.floor(remainder / 10);
        result += `${ten}십`;
        const one = remainder % 10;
        if (one > 0) {
          result += ` ${one}`;
        }
      } else {
        result += `${remainder}`;
      }
    }
  } else if (num >= 100) {
    // 백 단위
    const hundred = Math.floor(num / 100);
    result += `${hundred}백`;
    const remainder = num % 100;
    if (remainder > 0) {
      result += " ";
      if (remainder >= 10) {
        const ten = Math.floor(remainder / 10);
        result += `${ten}십`;
        const one = remainder % 10;
        if (one > 0) {
          result += ` ${one}`;
        }
      } else {
        result += `${remainder}`;
      }
    }
  } else if (num >= 10) {
    // 십 단위
    const ten = Math.floor(num / 10);
    result += `${ten}십`;
    const one = num % 10;
    if (one > 0) {
      result += ` ${one}`;
    }
  } else {
    // 일 단위
    result += `${num}`;
  }

  result += "원";
  return result;
};

// FilterSearch Props 인터페이스
interface FilterSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// 메인 FilterSearch 컴포넌트
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

  // 필터가 적용되었는지 확인
  const hasActiveFilters = Object.values(filters).some(
    (value) =>
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === "string" && value !== "")
  );

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50 max-w-lg bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">필터 검색</h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
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
          <Input
            placeholder="금액 입력"
            value={filters.deposit}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                deposit: formatNumberWithCommas(e.target.value),
              }))
            }
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
          {filters.deposit && (
            <p className="text-xs text-gray-700 mt-1">
              {formatKoreanCurrency(filters.deposit)}
            </p>
          )}
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
          <div className="flex items-center gap-2">
            <Input
              placeholder="최소 금액"
              value={filters.priceMin}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceMin: formatNumberWithCommas(e.target.value),
                }))
              }
              className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
            <span className="text-gray-500 text-sm">~</span>
            <Input
              placeholder="최대 금액"
              value={filters.priceMax}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceMax: formatNumberWithCommas(e.target.value),
                }))
              }
              className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </div>
          {(filters.priceMin || filters.priceMax) && (
            <div className="flex items-center gap-2 mt-1">
              {filters.priceMin && (
                <p className="text-xs text-gray-700">
                  {formatKoreanCurrency(filters.priceMin)}
                </p>
              )}
              {filters.priceMin && filters.priceMax && (
                <span className="text-xs text-gray-700">~</span>
              )}
              {filters.priceMax && (
                <p className="text-xs text-gray-700">
                  {formatKoreanCurrency(filters.priceMax)}
                </p>
              )}
            </div>
          )}
        </FilterSection>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-gray-200 p-3 mt-12 bg-white">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex-1 bg-white text-gray-700 border-gray-300"
          >
            전체 초기화
          </Button>
          <Button
            onClick={applyFilters}
            className="flex-1 bg-gray-900 text-white"
          >
            필터 적용 검색하기
          </Button>
        </div>
      </div>
    </div>
  );
}
