// 총 개동/층수/세대/잔여

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
  totalBuildingsType: "select" | "custom";
  setTotalBuildingsType: (v: "select" | "custom") => void;
  totalBuildings: string;
  setTotalBuildings: (v: string) => void;
  totalFloorsType: "select" | "custom";
  setTotalFloorsType: (v: "select" | "custom") => void;
  totalFloors: string;
  setTotalFloors: (v: string) => void;
  totalHouseholdsType: "select" | "custom";
  setTotalHouseholdsType: (v: "select" | "custom") => void;
  totalHouseholds: string;
  setTotalHouseholds: (v: string) => void;
  remainingHouseholdsType: "select" | "custom";
  setRemainingHouseholdsType: (v: "select" | "custom") => void;
  remainingHouseholds: string;
  setRemainingHouseholds: (v: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2">
        {/* 총 개동 */}
        <Field label="총 개동">
          <div className="flex gap-2 items-center">
            <Select
              value={
                totalBuildingsType === "select" ? totalBuildings : "custom"
              }
              onValueChange={(val) => {
                if (val === "custom") {
                  setTotalBuildingsType("custom");
                  setTotalBuildings("");
                } else {
                  setTotalBuildingsType("select");
                  setTotalBuildings(val);
                }
              }}
            >
              <SelectTrigger className="w-24 h-9">
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
            {totalBuildingsType === "custom" && (
              <Input
                value={totalBuildings}
                onChange={(e) => setTotalBuildings(e.target.value)}
                placeholder="예: 2"
                className="w-20 h-9 text-center"
                inputMode="numeric"
              />
            )}
          </div>
        </Field>

        {/* 총 층수 */}
        <Field label="총 층수">
          <div className="flex gap-2 items-center">
            <Select
              value={totalFloorsType === "select" ? totalFloors : "custom"}
              onValueChange={(val) => {
                if (val === "custom") {
                  setTotalFloorsType("custom");
                  setTotalFloors("");
                } else {
                  setTotalFloorsType("select");
                  setTotalFloors(val);
                }
              }}
            >
              <SelectTrigger className="w-24 h-9">
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
            {totalFloorsType === "custom" && (
              <Input
                value={totalFloors}
                onChange={(e) => setTotalFloors(e.target.value)}
                placeholder="예: 10"
                className="w-20 h-9 text-center"
                inputMode="numeric"
              />
            )}
          </div>
        </Field>
      </div>

      {/* 세대/잔여 */}
      <div className="grid grid-cols-2">
        {/* 총 세대수 */}
        <Field label="총 세대수">
          <div className="flex gap-2 items-center">
            <Select
              value={
                totalHouseholdsType === "select" ? totalHouseholds : "custom"
              }
              onValueChange={(val) => {
                if (val === "custom") {
                  setTotalHouseholdsType("custom");
                  setTotalHouseholds("");
                } else {
                  setTotalHouseholdsType("select");
                  setTotalHouseholds(val);
                }
              }}
            >
              <SelectTrigger className="w-24 h-9">
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
            {totalHouseholdsType === "custom" && (
              <Input
                value={totalHouseholds}
                onChange={(e) => setTotalHouseholds(e.target.value)}
                placeholder="예: 50"
                className="w-20 h-9 text-center"
                inputMode="numeric"
              />
            )}
          </div>
        </Field>

        {/* 잔여세대 */}
        <Field label="잔여세대">
          <div className="flex gap-2 items-center">
            <Select
              value={
                remainingHouseholdsType === "select"
                  ? remainingHouseholds
                  : "custom"
              }
              onValueChange={(val) => {
                if (val === "custom") {
                  setRemainingHouseholdsType("custom");
                  setRemainingHouseholds("");
                } else {
                  setRemainingHouseholdsType("select");
                  setRemainingHouseholds(val);
                }
              }}
            >
              <SelectTrigger className="w-24 h-9">
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
            {remainingHouseholdsType === "custom" && (
              <Input
                value={remainingHouseholds}
                onChange={(e) => setRemainingHouseholds(e.target.value)}
                placeholder="예: 10"
                className="w-20 h-9 text-center"
                inputMode="numeric"
              />
            )}
          </div>
        </Field>
      </div>
    </>
  );
}
