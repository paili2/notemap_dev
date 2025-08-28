// features/properties/components/modal/common/sections/OptionsSection.tsx
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Input } from "@/components/atoms/Input/Input";
import { Plus, X } from "lucide-react";

type Props = {
  ALL_OPTIONS?: readonly string[]; // (미사용이면 제거해도 OK)
  options?: string[];
  setOptions?: (next: string[]) => void;
  etcChecked: boolean;
  setEtcChecked?: (v: boolean) => void;
  optionEtc?: string;
  setOptionEtc?: (v: string) => void;
};

const PRESET_OPTIONS = [
  "에어컨",
  "냉장고",
  "세탁기",
  "건조기",
  "비데",
  "공기순환기",
] as const;

export default function OptionsSection({
  ALL_OPTIONS, // eslint-disable-line @typescript-eslint/no-unused-vars
  options,
  setOptions,
  etcChecked,
  setEtcChecked,
  optionEtc,
  setOptionEtc,
}: Props) {
  /** 안전 기본값 & 노옵 setter */
  const safeOptions = Array.isArray(options) ? options : [];
  const safeOptionEtc = optionEtc ?? "";
  const safeSetOptions =
    typeof setOptions === "function" ? setOptions : (_v: string[]) => {};
  const safeSetEtcChecked =
    typeof setEtcChecked === "function" ? setEtcChecked : (_v: boolean) => {};
  const safeSetOptionEtc =
    typeof setOptionEtc === "function" ? setOptionEtc : (_v: string) => {};

  /** 프리셋/커스텀 분리 */
  const presetSet = useMemo(
    () => new Set(PRESET_OPTIONS.map((v) => v.toLowerCase())),
    []
  );
  const presetSelected = useMemo(
    () => safeOptions.filter((v) => presetSet.has(v.trim().toLowerCase())),
    [safeOptions, presetSet]
  );
  const customFromOptions = useMemo(
    () => safeOptions.filter((v) => !presetSet.has(v.trim().toLowerCase())),
    [safeOptions, presetSet]
  );

  /** 커스텀 입력 목록 */
  const [customInputs, setCustomInputs] = useState<string[]>(
    customFromOptions.length > 0 ? customFromOptions : []
  );

  /** 외부 변경 반영 + 체크 ON일 땐 최소 1칸만 보장 */
  useEffect(() => {
    setCustomInputs((prev) => {
      const empties = prev.filter((v) => !v.trim());
      const merged = [...customFromOptions, ...empties];
      if (etcChecked) return merged.length >= 1 ? merged : [""];
      return merged;
    });
  }, [customFromOptions, etcChecked]);

  /** 기존 단일 입력값 흡수 */
  useEffect(() => {
    if (safeOptionEtc && etcChecked) {
      setCustomInputs((prev) => {
        const next = [...prev];
        if (next.length === 0) return [safeOptionEtc];
        if (!next[0]) next[0] = safeOptionEtc;
        return next;
      });
      safeSetOptionEtc("");
    }
  }, [safeOptionEtc, etcChecked]);

  /** options 동기화 (프리셋 + 커스텀 유니크) */
  const syncOptions = (nextCustomInputs: string[]) => {
    const uniques: string[] = [];
    const seen = new Set<string>();
    for (const v of nextCustomInputs) {
      const t = v.trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniques.push(t);
    }
    safeSetOptions([...presetSelected, ...uniques]);
  };

  const togglePreset = (op: string) => {
    const isOn = safeOptions.includes(op);
    if (isOn) safeSetOptions(safeOptions.filter((x) => x !== op));
    else safeSetOptions([...safeOptions, op]);
  };

  const addCustomFieldAfter = (index?: number) => {
    safeSetEtcChecked(true);
    setCustomInputs((prev) => {
      const copy = [...prev];
      const insertAt = typeof index === "number" ? index + 1 : copy.length;
      copy.splice(insertAt, 0, ""); // 한 칸씩만 추가
      return copy;
    });
  };

  const removeCustomField = (idx: number) => {
    setCustomInputs((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      const next = etcChecked && copy.length === 0 ? [""] : copy; // 최소 1칸 유지
      syncOptions(next);
      return next;
    });
  };

  const handleCustomChange = (idx: number, val: string) => {
    setCustomInputs((prev) => {
      const next = [...prev];
      next[idx] = val;
      syncOptions(next);
      return next;
    });
  };

  /** 2개씩 끊어 줄(row) 배열 만들기 → 메모 */
  const rows: Array<[string | undefined, string | undefined]> = useMemo(() => {
    const r: Array<[string | undefined, string | undefined]> = [];
    for (let i = 0; i < customInputs.length; i += 2) {
      r.push([customInputs[i], customInputs[i + 1]]);
    }
    return r;
  }, [customInputs]);

  /** 셀 폭(인풋+삭제 버튼)을 고정해서 +버튼 위치 흔들리지 않게 */
  const CELL_W_BASE = "w-[200px]";
  const CELL_W_MD = "md:w-[220px]";
  const INPUT_W_BASE = "w-[160px]";
  const INPUT_W_MD = "md:w-[180px]";

  /** 한 셀(인풋 + 삭제) */
  const Cell = ({
    value,
    index,
    placeholder,
  }: {
    value: string | undefined;
    index: number;
    placeholder: string;
  }) => {
    if (value === undefined) {
      return <div className={`h-9 ${CELL_W_BASE} ${CELL_W_MD}`} />;
    }
    return (
      <div className={`flex items-center gap-1 ${CELL_W_BASE} ${CELL_W_MD}`}>
        <Input
          value={value}
          onChange={(e) => handleCustomChange(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomFieldAfter(index);
            }
          }}
          placeholder={placeholder}
          className={`h-9 ${INPUT_W_BASE} ${INPUT_W_MD} shrink-0`}
        />
        <button
          type="button"
          onClick={() => removeCustomField(index)}
          className="text-sm px-1 text-gray-500 hover:text-red-600"
          title="입력칸 삭제"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">옵션</div>

      {/* 프리셋 6개 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-center">
        {PRESET_OPTIONS.map((op) => (
          <label key={op} className="inline-flex items-center gap-2 text-sm">
            <Checkbox
              checked={safeOptions.includes(op)}
              onCheckedChange={() => togglePreset(op)}
            />
            <span className="text-sm">{op}</span>
          </label>
        ))}
      </div>

      {/* 직접입력: 2칸씩 한 줄, 마지막 줄 오른쪽 끝에 + 버튼 (고정 위치) */}
      <div className="space-y-2">
        <div className="grid grid-cols-[auto_200px_200px_auto] md:grid-cols-[auto_220px_220px_auto] gap-x-2 gap-y-2 items-center">
          {etcChecked ? (
            rows.map((pair, rowIdx) => {
              const isFirstRow = rowIdx === 0;
              const isLastRow = rowIdx === rows.length - 1;
              const [v1, v2] = pair;
              const baseIndex = rowIdx * 2;

              return (
                <React.Fragment key={rowIdx}>
                  {/* 1열: 체크박스(첫 줄만) */}
                  <div className="min-h-9 flex items-center">
                    {isFirstRow ? (
                      <label className="inline-flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={etcChecked}
                          onCheckedChange={(c) => {
                            const next = c === true;
                            safeSetEtcChecked(next);
                            if (!next) {
                              setCustomInputs([]);
                              safeSetOptions(presetSelected);
                            } else {
                              setCustomInputs((prev) =>
                                prev.length === 0 ? [""] : prev
                              );
                            }
                          }}
                        />
                        <span className="text-sm">직접입력</span>
                      </label>
                    ) : (
                      <div className="h-9" />
                    )}
                  </div>

                  {/* 2열: 인풋 #1 */}
                  <Cell
                    value={v1}
                    index={baseIndex}
                    placeholder="예: 식기세척기"
                  />

                  {/* 3열: 인풋 #2 */}
                  <Cell
                    value={v2}
                    index={baseIndex + 1}
                    placeholder="예: 건조기 스탠드"
                  />

                  {/* 4열: 마지막 줄 오른쪽 끝 + 버튼 */}
                  <div className="flex items-center justify-start">
                    {isLastRow && (
                      <button
                        type="button"
                        onClick={() =>
                          addCustomFieldAfter(
                            baseIndex + (v2 !== undefined ? 1 : 0)
                          )
                        }
                        className="text-sm px-1 text-gray-500 hover:text-blue-600"
                        title="입력칸 추가"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          ) : (
            <>
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox
                  checked={etcChecked}
                  onCheckedChange={(c) => {
                    const next = c === true;
                    safeSetEtcChecked(next);
                    if (next) {
                      setCustomInputs((prev) =>
                        prev.length === 0 ? [""] : prev
                      );
                    }
                  }}
                />
                <span className="text-sm">직접입력</span>
              </label>
              <div className={`h-9 ${CELL_W_BASE} ${CELL_W_MD}`} />
              <div className={`h-9 ${CELL_W_BASE} ${CELL_W_MD}`} />
              <div className="h-9" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
