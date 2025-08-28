"use client";

import { Input } from "@/components/atoms/Input/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";
import Field from "../Field";

type Mode = "select" | "custom";

export default function NumbersSection({
  numberItems,
  totalBuildingsType,
  setTotalBuildingsType,
  totalBuildings,
  setTotalBuildings,
  totalFloorsType,
  setTotalFloorsType,
  totalFloors,
  setTotalFloors,
  totalHouseholdsType,
  setTotalHouseholdsType,
  totalHouseholds,
  setTotalHouseholds,
  remainingHouseholdsType,
  setRemainingHouseholdsType,
  remainingHouseholds,
  setRemainingHouseholds,
}: {
  numberItems: string[];
  totalBuildingsType: Mode;
  setTotalBuildingsType: (v: Mode) => void;
  totalBuildings: string;
  setTotalBuildings: (v: string) => void;
  totalFloorsType: Mode;
  setTotalFloorsType: (v: Mode) => void;
  totalFloors: string;
  setTotalFloors: (v: string) => void;
  totalHouseholdsType: Mode;
  setTotalHouseholdsType: (v: Mode) => void;
  totalHouseholds: string;
  setTotalHouseholds: (v: string) => void;
  remainingHouseholdsType: Mode;
  setRemainingHouseholdsType: (v: Mode) => void;
  remainingHouseholds: string;
  setRemainingHouseholds: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-4">
      <FieldCell
        label="총 개동"
        align="start"
        mode={totalBuildingsType}
        setMode={setTotalBuildingsType}
        value={totalBuildings}
        setValue={setTotalBuildings}
        numberItems={numberItems}
        inputPlaceholder="예: 2"
      />
      <FieldCell
        label="총 층수"
        align="start"
        mode={totalFloorsType}
        setMode={setTotalFloorsType}
        value={totalFloors}
        setValue={setTotalFloors}
        numberItems={numberItems}
        inputPlaceholder="예: 10"
      />
      <FieldCell
        label="총 세대수"
        align="start"
        mode={totalHouseholdsType}
        setMode={setTotalHouseholdsType}
        value={totalHouseholds}
        setValue={setTotalHouseholds}
        numberItems={numberItems}
        inputPlaceholder="예: 50"
      />
      <FieldCell
        label="잔여세대"
        align="start"
        mode={remainingHouseholdsType}
        setMode={setRemainingHouseholdsType}
        value={remainingHouseholds}
        setValue={setRemainingHouseholds}
        numberItems={numberItems}
        inputPlaceholder="예: 10"
      />
    </div>
  );
}

/** 한 칸: 2행 그리드 (row1=셀렉트 고정 높이, row2=직접입력 인풋) + Field 위정렬 */
function FieldCell({
  label,
  align = "start",
  mode,
  setMode,
  value,
  setValue,
  numberItems,
  inputPlaceholder,
}: {
  label: string;
  align?: "start" | "center";
  mode: Mode;
  setMode: (v: Mode) => void;
  value: string;
  setValue: (v: string) => void;
  numberItems: string[];
  inputPlaceholder: string;
}) {
  const isCustom = mode === "custom";

  return (
    <Field
      label={label}
      dense
      gap={1}
      labelWidth={56}
      labelClassName="truncate"
      align={align}
    >
      {/* 1행 높이 고정 -> 네 칸 셀렉트 라인 완벽 정렬 */}
      <div className="grid grid-rows-[2rem_auto] gap-0">
        <div className="row-start-1 h-8 flex items-center">
          <Select
            value={isCustom ? "custom" : value}
            onValueChange={(val) => {
              if (val === "custom") {
                setMode("custom");
                setValue("");
              } else {
                setMode("select");
                setValue(val);
              }
            }}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-auto">
              {numberItems.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
              <SelectItem value="custom">직접입력</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2행: 직접입력일 때만 표시 (셀렉트 바로 밑) */}
        <div className="row-start-2">
          {isCustom && (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="mt-2 h-8 w-24 text-left px-2"
              inputMode="numeric"
            />
          )}
        </div>
      </div>
    </Field>
  );
}
