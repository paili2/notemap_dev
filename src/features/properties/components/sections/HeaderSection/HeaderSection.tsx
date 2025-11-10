"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import ElevatorSegment from "./components/ElevatorSegment";
import PinTypeSelect from "./components/PinTypeSelect";
import BuildingGradeSegment from "./components/BuildingGradeSegment";
import { Button } from "@/components/atoms/Button/Button";
import StarsRating from "@/components/molecules/StarsRating";
import { HeaderSectionProps } from "./types";
import type { BuildingGrade } from "./types"; // ⬅️ 공식 타입 import
import { asControlled } from "@/features/properties/lib/forms/asControlled";

// ⛔️ 아래 두 타입은 삭제하세요
// type BuildingGradeUi = "" | "new" | "old";
// type ExtraProps = {
//   buildingGrade?: BuildingGradeUi;
//   setBuildingGrade?: (v: BuildingGradeUi) => void;
// };

export default function HeaderSection(
  // ⬇️ Partial<{ buildingGrade; setBuildingGrade }>를 공식 타입으로 명시
  props: HeaderSectionProps &
    Partial<{
      buildingGrade: BuildingGrade;
      setBuildingGrade: (v: BuildingGrade) => void;
    }>
) {
  const {
    title,
    setTitle,
    parkingGrade,
    setParkingGrade,
    elevator,
    setElevator,
    placeholderHint,
    pinKind,
    setPinKind,
    buildingGrade,
    setBuildingGrade,
  } = props;

  const placeholder = placeholderHint ?? "예: 성수 리버뷰 84A";
  const gradeNum = parkingGrade ? Number(parkingGrade) : 0;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="grid grid-cols-1 md:grid-cols-[auto_auto_auto_1fr_auto] items-center gap-3 px-4 py-4 min-w-0">
        {/* 1) 신축/구옥 */}
        <div className="order-1 md:order-1">
          <BuildingGradeSegment
            value={buildingGrade ?? null} // ⬅️ null 비선택 상태
            onChange={(v) => setBuildingGrade?.(v)} // ⬅️ v: "new" | "old" | null
          />
        </div>

        {/* 2) 핀선택 */}
        <div className="order-2 md:order-2">
          <PinTypeSelect
            value={pinKind ?? null}
            onChange={(v) => setPinKind(v)}
            className="h-9 w-[160px] md:w-[190px]"
            placeholder="핀선택"
          />
        </div>

        {/* 3) 매물평점 */}
        <div className="order-3 md:order-3 flex items-center gap-2 min-w-[150px]">
          <span className="text-[16px] md:text-[18px] font-semibold text-gray-800 whitespace-nowrap">
            매물평점
          </span>
          <div className="w-[120px] md:w-[200px] leading-none">
            <div className="flex items-center">
              <StarsRating
                value={gradeNum}
                onChange={(n: number) =>
                  setParkingGrade(
                    n && n >= 1 && n <= 5
                      ? (String(n) as HeaderSectionProps["parkingGrade"])
                      : ("" as HeaderSectionProps["parkingGrade"])
                  )
                }
                className="leading-none antialiased"
              />
              {gradeNum > 0 && (
                <Button
                  type="button"
                  onClick={() =>
                    setParkingGrade("" as HeaderSectionProps["parkingGrade"])
                  }
                  variant="plain"
                  size="icon"
                  className="ml-1 h-8 w-8 rounded-full"
                  title="별점 초기화"
                >
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 4) 매물명 */}
        <div className="order-4 md:order-4 flex items-center gap-2 min-w-0">
          <span className="text-[16px] md:text-[18px] font-semibold text-gray-800 whitespace-nowrap">
            매물명
          </span>
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <input
              value={asControlled(title)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.currentTarget.value)
              }
              placeholder={placeholder}
              className={cn(
                "w-full h-10 rounded-md border px-3 text-sm",
                "outline-none focus:ring-2 focus:ring-blue-200"
              )}
            />
          </div>
        </div>

        {/* 5) 엘리베이터 */}
        <div className="order-5 md:order-5 justify-self-end flex items-center gap-2">
          <span className="text-[16px] md:text-[18px] font-semibold text-gray-800">
            엘리베이터
          </span>
          <ElevatorSegment value={elevator} onChange={setElevator} />
        </div>
      </div>
    </header>
  );
}
