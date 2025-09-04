"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";

interface FilterState {
  rooms: string[];
  deposit: string;
  area: string;
  buildingType: string[];
  elevator: string;
  priceMin: string;
  priceMax: string;
}

export default function FilterSearch() {
  const [filters, setFilters] = useState<FilterState>({
    rooms: [],
    deposit: "",
    area: "",
    buildingType: [],
    elevator: "",
    priceMin: "",
    priceMax: "",
  });

  const roomOptions = ["1룸", "1.5룸", "2룸", "3룸", "4룸", "복층", "테라스"];
  const areaOptions = ["17평 이하", "17평 이상"];
  const buildingOptions = ["주택", "APT", "OP", "도/생", "근/생"];
  const elevatorOptions = ["있음", "없음"];

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
    setFilters({
      rooms: [],
      deposit: "",
      area: "",
      buildingType: [],
      elevator: "",
      priceMin: "",
      priceMax: "",
    });
  };

  const applyFilters = () => {
    console.log("Applying filters:", filters);
    // 필터 적용 로직 구현
  };

  return (
    <div className="max-w-md mx-auto bg-white h-screen pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">필터 검색</h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* 방 */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">방</h2>
          <div className="flex flex-wrap gap-2">
            {roomOptions.map((room) => (
              <Button
                key={room}
                variant={filters.rooms.includes(room) ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  filters.rooms.includes(room)
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => toggleSelection("rooms", room)}
              >
                {room}
              </Button>
            ))}
          </div>
        </div>

        {/* 실입주금 */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">실입주금</h2>
          <Input
            placeholder="금액 입력"
            value={filters.deposit}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, deposit: e.target.value }))
            }
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
        </div>

        {/* 전용 */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">전용</h2>
          <div className="flex gap-2">
            {areaOptions.map((area) => (
              <Button
                key={area}
                variant={filters.area === area ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  filters.area === area
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => toggleSelection("area", area)}
              >
                {area}
              </Button>
            ))}
          </div>
        </div>

        {/* 등기 */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">등기</h2>
          <div className="flex flex-wrap gap-2">
            {buildingOptions.map((building) => (
              <Button
                key={building}
                variant={
                  filters.buildingType.includes(building)
                    ? "default"
                    : "outline"
                }
                size="sm"
                className={`text-xs ${
                  filters.buildingType.includes(building)
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => toggleSelection("buildingType", building)}
              >
                {building}
              </Button>
            ))}
          </div>
        </div>

        {/* 엘리베이터 */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">엘리베이터</h2>
          <div className="flex gap-2">
            {elevatorOptions.map((elevator) => (
              <Button
                key={elevator}
                variant={filters.elevator === elevator ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  filters.elevator === elevator
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => toggleSelection("elevator", elevator)}
              >
                {elevator}
              </Button>
            ))}
          </div>
        </div>

        {/* 매매가 */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">매매가</h2>
          <div className="flex items-center gap-2">
            <Input
              placeholder="최소 금액"
              value={filters.priceMin}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, priceMin: e.target.value }))
              }
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
            <span className="text-gray-500">~</span>
            <Input
              placeholder="최대 금액"
              value={filters.priceMax}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, priceMax: e.target.value }))
              }
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
        <div className="max-w-md mx-auto flex gap-3">
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
