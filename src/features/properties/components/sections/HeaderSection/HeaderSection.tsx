// HeaderSection.tsx
"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import ElevatorSegment from "./components/ElevatorSegment";
import PinTypeSelect from "./components/PinTypeSelect";
import { Button } from "@/components/atoms/Button/Button";
import StarsRating from "@/components/molecules/StarsRating";
import { HeaderSectionProps } from "./types";

export default function HeaderSection({
  title,
  setTitle,
  parkingGrade,
  setParkingGrade,
  elevator,
  setElevator,
  onClose,
  placeholderHint,
  pinKind,
  setPinKind,
}: HeaderSectionProps) {
  const placeholder = placeholderHint ?? "예: 성수 리버뷰 84A";
  const gradeNum = parkingGrade ? Number(parkingGrade) : 0;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b supports-[backdrop-filter]:bg-white/70">
      <div className="grid grid-cols-[1fr_auto] md:flex md:flex-nowrap items-center gap-3 gap-y-2 px-4 py-4 pr-4 min-w-0">
        <div className="col-span-1 justify-self-start md:order-1 md:flex md:items-center md:gap-2 md:shrink-0">
          <PinTypeSelect
            value={pinKind}
            onChange={setPinKind}
            className="h-9 w-[200px] max-w-full md:w-[230px]"
            placeholder="핀 종류 선택"
          />
        </div>

        <div className="hidden md:block h-5 w-px bg-gray-200 mx-2 md:order-2 shrink-0" />

        <div className="col-span-1 justify-self-end md:order-7 md:flex md:items-center md:gap-2">
          <span className="text-[18px] font-semibold text-gray-800 pr-2">
            엘리베이터
          </span>
          <ElevatorSegment value={elevator} onChange={setElevator} />
        </div>

        <div className="hidden md:block h-5 w-px bg-gray-200 mx-2 md:order-4 shrink-0" />

        <div className="col-span-2 flex items-center gap-2 md:order-3">
          <span className="text-[18px] font-semibold text-gray-800 whitespace-nowrap">
            매물평점
          </span>
          <div className="w-[120px] md:w-[200px] leading-none">
            <div className="flex items-center">
              <StarsRating
                value={gradeNum}
                onChange={(n: number) =>
                  setParkingGrade(
                    String(n) as HeaderSectionProps["parkingGrade"]
                  )
                }
                className="leading-none antialiased"
              />
              {gradeNum > 0 && (
                <Button
                  type="button"
                  onClick={() => setParkingGrade("")}
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

        <div className="hidden md:block h-5 w-px bg-gray-200 mx-2 md:order-6 shrink-0" />

        <div className="col-span-2 flex items-center gap-2 md:order-5 md:flex-1 min-w-0">
          <span className="text-[18px] font-semibold text-gray-800 whitespace-nowrap">
            매물명
          </span>
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <input
              value={title}
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
