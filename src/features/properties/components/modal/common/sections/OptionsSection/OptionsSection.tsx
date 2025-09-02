"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Plus } from "lucide-react";
import { OptionsSectionProps } from "./types";
import OptionCell from "./OptionCell";

export default function OptionsSection({
  PRESET_OPTIONS,
  options,
  setOptions,
  etcChecked,
  setEtcChecked,
  optionEtc,
  setOptionEtc,
}: OptionsSectionProps) {
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
    [PRESET_OPTIONS]
  );
  const presetSelected = useMemo(
    () => safeOptions.filter((v) => presetSet.has(v.trim().toLowerCase())),
    [safeOptions, presetSet]
  );
  const customFromOptions = useMemo(
    () => safeOptions.filter((v) => !presetSet.has(v.trim().toLowerCase())),
    [safeOptions, presetSet]
  );

  /** 커스텀 입력 목록(로컬) */
  const [customInputs, setCustomInputs] = useState<string[]>(
    customFromOptions.length > 0 ? customFromOptions : []
  );
  const customInputsRef = useRef(customInputs);
  useEffect(() => {
    customInputsRef.current = customInputs;
  }, [customInputs]);

  /** echo 가드: 내가 setOptions 한 직후 1회 외부 반영 이펙트 스킵 */
  const echoGuardRef = useRef(false);

  /** 외부 변경 반영 + 체크 ON일 땐 최소 1칸 보장 */
  useEffect(() => {
    if (echoGuardRef.current) {
      echoGuardRef.current = false; // 한 번만 스킵
      return;
    }
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
  }, [safeOptionEtc, etcChecked, safeSetOptionEtc]);

  /** options 동기화 (프리셋 + 커스텀 유니크) — 프리셋 동일 텍스트는 제외 */
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
    const customsNotPreset = uniques.filter(
      (t) => !presetSet.has(t.trim().toLowerCase())
    );

    echoGuardRef.current = true; // ✅ 다음 외부 반영 1회 무시
    safeSetOptions([...presetSelected, ...customsNotPreset]);
  };

  /** 프리셋 토글 */
  const togglePreset = (op: string) => {
    const isOn = safeOptions.includes(op);
    echoGuardRef.current = true;
    if (isOn) safeSetOptions(safeOptions.filter((x) => x !== op));
    else safeSetOptions([...safeOptions, op]);
  };

  /** 칸 추가/삭제/편집 */
  const addCustomFieldAfter = (index?: number) => {
    safeSetEtcChecked(true);
    setCustomInputs((prev) => {
      const copy = [...prev];
      const insertAt = typeof index === "number" ? index + 1 : copy.length;
      copy.splice(insertAt, 0, ""); // 한 칸 추가
      return copy;
    });
  };

  const removeCustomField = (idx: number) => {
    setCustomInputs((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      const next = etcChecked && copy.length === 0 ? [""] : copy;
      // 삭제는 즉시 커밋(UX 선호에 따라 onBlur로 미룰 수도)
      syncOptions(next);
      return next;
    });
  };

  /** 로컬만 업데이트(타이핑 중) */
  const handleCustomChangeLocal = (idx: number, val: string) => {
    setCustomInputs((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  /** onBlur 등에서 커밋 */
  const commitSync = () => {
    syncOptions(customInputsRef.current);
  };

  /** 2개씩 끊어 줄(row) 배열 만들기 */
  const rows: Array<[string | undefined, string | undefined]> = useMemo(() => {
    const r: Array<[string | undefined, string | undefined]> = [];
    for (let i = 0; i < customInputs.length; i += 2) {
      r.push([customInputs[i], customInputs[i + 1]]);
    }
    return r;
  }, [customInputs]);

  /** 폭 클래스 (그리드 안정화) */
  const CELL_W_BASE = "w-[200px]";
  const CELL_W_MD = "md:w-[220px]";
  const INPUT_W_BASE = "w-[160px]";
  const INPUT_W_MD = "md:w-[180px]";

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">옵션</div>

      {/* 프리셋 */}
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

      {/* 직접입력 */}
      <div className="space-y-2">
        <div className="grid grid-cols-[auto_200px_200px_auto] md:grid-cols-[auto_220px_220px_auto] gap-x-2 gap-y-2 items-center">
          {etcChecked ? (
            rows.map((pair, rowIdx) => {
              const isFirstRow = rowIdx === 0;
              const isLastRow = rowIdx === rows.length - 1;
              const [v1, v2] = pair;
              const baseIndex = rowIdx * 2;

              return (
                <Fragment key={`row-${rowIdx}-${customInputs.length}`}>
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
                              echoGuardRef.current = true;
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
                  <OptionCell
                    value={v1}
                    index={baseIndex}
                    placeholder="예: 식기세척기"
                    onChangeLocal={handleCustomChangeLocal}
                    onCommit={commitSync}
                    onRemove={removeCustomField}
                    onAddAfter={addCustomFieldAfter}
                    cellWidthBase={CELL_W_BASE}
                    cellWidthMd={CELL_W_MD}
                    inputWidthBase={INPUT_W_BASE}
                    inputWidthMd={INPUT_W_MD}
                  />

                  {/* 3열: 인풋 #2 */}
                  <OptionCell
                    value={v2}
                    index={baseIndex + 1}
                    placeholder="예: 건조기 스탠드"
                    onChangeLocal={handleCustomChangeLocal}
                    onCommit={commitSync}
                    onRemove={removeCustomField}
                    onAddAfter={addCustomFieldAfter}
                    cellWidthBase={CELL_W_BASE}
                    cellWidthMd={CELL_W_MD}
                    inputWidthBase={INPUT_W_BASE}
                    inputWidthMd={INPUT_W_MD}
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
                </Fragment>
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
