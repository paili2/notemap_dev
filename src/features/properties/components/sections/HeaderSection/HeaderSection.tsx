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
    /** 답사예정핀일 때 true → 신축/구옥 + 별 + 리베이트 막기 */
    isVisitPlanPin?: boolean;
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
    isVisitPlanPin,
  } = props;

  const placeholder = placeholderHint ?? "예: 성수 리버뷰 84A";
  const gradeNum = parkingGrade ? Number(parkingGrade) : 0;

  /** 답사예정일 때 매물평점 / 리베이트 비활성화 */
  const ratingDisabled = !!isVisitPlanPin;
  const rebateDisabled = !!isVisitPlanPin;

  /** ───────── 신축/구옥 어댑터 ───────── */
  const buildingGrade: BuildingGrade | null =
    _buildingGrade === "new" || _buildingGrade === "old"
      ? _buildingGrade
      : null;

  const setBuildingGrade =
    typeof _setBuildingGrade === "function"
      ? _setBuildingGrade
      : (_: BuildingGrade | null) => {};

  const uiValue: "" | "new" | "old" =
    buildingGrade === "new" ? "new" : buildingGrade === "old" ? "old" : "";

  const handleUiChange = (v: "" | "new" | "old") => {
    if (!v) {
      setBuildingGrade(null);
    } else {
      setBuildingGrade(v);
    }
  };

  /** ───────── 리베이트 입력 (setRebate 없을 때 fallback 상태) ───────── */
  const [fallbackRebate, setFallbackRebate] = React.useState<string>("");

  // ✅ 답사예정으로 전환될 때 값 초기화 (신축/구옥 + 별점 + 리베이트)
  const prevIsVisitPlanRef = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    const prev = prevIsVisitPlanRef.current;
    const current = !!isVisitPlanPin;

    // 일반핀(false) → 답사예정(true)으로 바뀌는 순간에만 초기화
    if (current && prev === false) {
      // 신축/구옥 초기화
      setBuildingGrade(null);
      // 별점 초기화
      setParkingGrade("" as HeaderSectionProps["parkingGrade"]);
      // 리베이트 초기화
      if (setRebate) {
        setRebate(null);
      } else {
        setFallbackRebate("");
      }
    }

    prevIsVisitPlanRef.current = current;
  }, [isVisitPlanPin, setBuildingGrade, setParkingGrade, setRebate]);

  const rebateDisplay = setRebate
    ? rebate == null
      ? ""
      : String(rebate)
    : fallbackRebate;

  const handleChangeRebate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (rebateDisabled) return;

    const raw = e.currentTarget.value;

    // 부모가 상태를 관리해주는 경우 (HeaderContainer → useEditForm.rebateRaw)
    if (setRebate) {
      // 빈 문자열이면 null 로
      setRebate(raw.trim() === "" ? null : raw);
      return;
    }

    // 부모가 setRebate를 안 넘겨준 경우 → 로컬 상태만 업데이트
    setFallbackRebate(raw);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="flex flex-wrap items-center gap-6 px-4 py-4 min-w-0">
        {/* 1) 신축/구옥 — 답사예정일 때만 비활성화 */}
        <div
          className={cn(
            "order-1 flex-shrink-0",
            isVisitPlanPin && "pointer-events-none opacity-60"
          )}
        >
          <BuildingGradeSegment value={uiValue} onChange={handleUiChange} />
        </div>

        {/* 2) 핀선택 — buildingGrade에 따라 아이콘 변경 */}
        <div className="order-2 flex-shrink-0">
          <PinTypeSelect
            value={pinKind ?? null}
            onChange={(v) => setPinKind(v)}
            className="h-9 w-[140px] md:w-[190px]"
            placeholder="핀선택"
            buildingGrade={buildingGrade ?? null}
          />
        </div>

        {/* 3) 매물평점 — 답사예정일 때만 비활성화 */}
        <div className="order-3 flex items-center gap-2 min-w-[150px]">
          <span
            className={cn(
              "text-[16px] md:text-[18px] font-semibold whitespace-nowrap",
              ratingDisabled ? "text-gray-400" : "text-gray-800"
            )}
          >
            매물평점
          </span>
          <div className="w-[140px] md:w-[200px] leading-none">
            <div
              className={cn(
                "flex items-center",
                ratingDisabled && "pointer-events-none opacity-60"
              )}
            >
              <StarsRating
                value={gradeNum}
                onChange={
                  ratingDisabled
                    ? () => {}
                    : (n: number) =>
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
                    !ratingDisabled &&
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

        {/* 4) 매물명 — 항상 입력 가능 */}
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

        {/* 5) 리베이트 R표시 — 답사예정일 때만 비활성화 */}
        <div
          className={cn(
            "order-5 flex items-center gap-3",
            rebateDisabled && "pointer-events-none opacity-60"
          )}
        >
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
