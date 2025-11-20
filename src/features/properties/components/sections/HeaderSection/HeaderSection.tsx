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
import { asControlled } from "@/features/properties/lib/forms/asControlled";
import { BuildingGrade } from "@/features/properties/types/building-grade";

export default function HeaderSection(
  props: HeaderSectionProps & {
    /** 내부 상태는 "new" | "old" 만 사용 */
    buildingGrade?: BuildingGrade;
    setBuildingGrade?: (v: BuildingGrade) => void;
  }
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
    buildingGrade: _buildingGrade,
    setBuildingGrade: _setBuildingGrade,
  } = props;

  const placeholder = placeholderHint ?? "예: 성수 리버뷰 84A";
  const gradeNum = parkingGrade ? Number(parkingGrade) : 0;

  /** ───────── 신축/구옥 어댑터 ───────── */
  const buildingGrade: "new" | "old" = _buildingGrade === "old" ? "old" : "new";
  const setBuildingGrade =
    typeof _setBuildingGrade === "function" ? _setBuildingGrade : () => {};

  const uiValue: "" | "new" | "old" = buildingGrade;
  const handleUiChange = (v: "" | "new" | "old" | null) => {
    setBuildingGrade(v === "old" ? "old" : "new");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div
        className={cn(
          // 모바일: flex-row + wrap
          "flex flex-wrap items-center gap-3 px-4 py-4 min-w-0",
          // 데스크탑: 기존 grid 레이아웃 유지
          "md:grid md:grid-cols-[auto_auto_auto_1fr_auto]"
        )}
      >
        {/* 1) 신축/구옥 */}
        <div className="order-1 md:order-1 flex-shrink-0">
          <BuildingGradeSegment value={uiValue} onChange={handleUiChange} />
        </div>

        {/* 2) 핀선택 */}
        <div className="order-2 md:order-2 flex-shrink-0">
          <PinTypeSelect
            value={pinKind ?? null}
            onChange={(v) => setPinKind(v)}
            className="h-9 w-[140px] md:w-[190px]"
            placeholder="핀선택"
          />
        </div>

        {/* 3) 엘리베이터 → 모바일에선 1줄의 세 번째, PC에선 맨 오른쪽 */}
        <div className="order-3 md:order-5 flex items-center gap-2 ml-auto md:ml-0 justify-self-end">
          <span className="text-[16px] md:text-[18px] font-semibold text-gray-800 whitespace-nowrap">
            엘리베이터
          </span>
          <ElevatorSegment value={elevator} onChange={setElevator} />
        </div>

        {/* 4) 매물평점 → 모바일에선 두 번째 줄 전체 폭, PC에선 기존 위치 */}
        <div className="order-4 md:order-3 flex items-center gap-2 min-w-[150px] w-full md:w-auto">
          <span className="text-[16px] md:text-[18px] font-semibold text-gray-800 whitespace-nowrap">
            매물평점
          </span>
          <div className="w-[140px] md:w-[200px] leading-none">
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

        {/* 5) 매물명 → 모바일에선 두 번째 줄 아래 전체 폭 */}
        <div className="order-5 md:order-4 flex items-center gap-2 min-w-0 w-full">
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
      </div>
    </header>
  );
}
