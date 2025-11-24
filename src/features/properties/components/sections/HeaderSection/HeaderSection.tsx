"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import PinTypeSelect from "./components/PinTypeSelect";
import BuildingGradeSegment from "./components/BuildingGradeSegment";
import { Button } from "@/components/atoms/Button/Button";
import StarsRating from "@/components/molecules/StarsRating";
import { HeaderSectionProps } from "./types";
import { asControlled } from "@/features/properties/lib/forms/asControlled";
import { BuildingGrade } from "@/features/properties/types/building-grade";

export default function HeaderSection(
  props: HeaderSectionProps & {
    /** 신축/구옥: "new" | "old" | null (null = 미선택) */
    buildingGrade?: BuildingGrade | null;
    setBuildingGrade?: (v: BuildingGrade | null) => void;
    /** 헤더에서 입력받는 리베이트(만원 단위) */
    rebate?: string | number | null;
    setRebate?: (v: string | number | null) => void;
  }
) {
  const {
    title,
    setTitle,
    parkingGrade,
    setParkingGrade,
    placeholderHint,
    pinKind,
    setPinKind,
    buildingGrade: _buildingGrade,
    setBuildingGrade: _setBuildingGrade,
    rebate,
    setRebate,
  } = props;

  const placeholder = placeholderHint ?? "예: 성수 리버뷰 84A";
  const gradeNum = parkingGrade ? Number(parkingGrade) : 0;

  /** ───────── 신축/구옥 어댑터 ─────────
   *  - 내부 상태: BuildingGrade | null
   *  - UI 컴포넌트: "" | "new" | "old"
   */
  const buildingGrade: BuildingGrade | null =
    _buildingGrade === "new" || _buildingGrade === "old"
      ? _buildingGrade
      : null;

  const setBuildingGrade =
    typeof _setBuildingGrade === "function"
      ? _setBuildingGrade
      : (_: BuildingGrade | null) => {};

  // ✅ UI 값: null → "" 로 내려서 "미선택" 상태 표현
  const uiValue: "" | "new" | "old" =
    buildingGrade === "new" ? "new" : buildingGrade === "old" ? "old" : "";

  const handleUiChange = (v: "" | "new" | "old") => {
    if (!v) {
      // 미선택
      setBuildingGrade(null);
    } else {
      setBuildingGrade(v);
    }
  };

  /** ───────── 리베이트 입력 ───────── */
  const handleChangeRebate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!setRebate) return;
    const raw = e.currentTarget.value;

    const cleaned = raw.replace(/,/g, "");
    if (cleaned === "") {
      setRebate(null);
      return;
    }

    const n = Number(cleaned);
    if (Number.isNaN(n)) {
      setRebate(raw);
    } else {
      setRebate(n);
    }
  };

  const rebateDisplay =
    typeof rebate === "number" ? rebate.toString() : asControlled(rebate);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div
        className={cn(
          // 🔹 전체를 flex로만 두고 gap을 통일
          "flex flex-wrap items-center gap-6 px-4 py-4 min-w-0"
        )}
      >
        {/* 1) 신축/구옥 */}
        <div className="order-1 flex-shrink-0">
          <BuildingGradeSegment value={uiValue} onChange={handleUiChange} />
        </div>

        {/* 2) 핀선택 */}
        <div className="order-2 flex-shrink-0">
          <PinTypeSelect
            value={pinKind ?? null}
            onChange={(v) => setPinKind(v)}
            className="h-9 w-[140px] md:w-[190px]"
            placeholder="핀선택"
          />
        </div>

        {/* 3) 매물평점 */}
        <div className="order-3 flex items-center gap-2 min-w-[150px]">
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

        {/* 4) 매물명 */}
        <div className="order-4 flex items-center gap-2 min-w-0">
          <span className="text-[16px] md:text-[18px] font-semibold text-gray-800 whitespace-nowrap">
            매물명
          </span>
          <div className="w-[180px] sm:w-[220px]">
            <input
              value={asControlled(title)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.currentTarget.value)
              }
              placeholder={placeholder}
              className={cn(
                "h-10 w-full rounded-md border px-3 text-sm",
                "outline-none focus:ring-2 focus:ring-blue-200"
              )}
            />
          </div>
        </div>

        {/* 5) 리베이트 R표시 */}
        <div className="order-5 flex items-center gap-3">
          <span className="text-[20px] md:text-[22px] font-extrabold text-red-500 leading-none">
            R
          </span>
          <input
            value={rebateDisplay}
            onChange={handleChangeRebate}
            placeholder="10"
            className={cn(
              "w-16 h-9 rounded-md border px-2 text-sm text-right",
              "outline-none focus:ring-2 focus:ring-red-200",
              "text-red-500 font-semibold"
            )}
          />
        </div>
      </div>
    </header>
  );
}
