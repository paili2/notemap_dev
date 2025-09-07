"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Plus } from "lucide-react";
import { OptionsSectionProps } from "./types";
import OptionCell from "./OptionCell";
import { Button } from "@/components/atoms/Button/Button";

/** 필요시 레거시 문자열 분리용 */
const SPLIT_RE = /[,\n;/]+/;

export default function OptionsSection({
  PRESET_OPTIONS,
  options,
  setOptions,
  etcChecked,
  setEtcChecked,
  optionEtc,
  setOptionEtc,
}: OptionsSectionProps) {
  /** 안전게이트 */
  const safeOptions = Array.isArray(options) ? options : [];
  const safeSetOptions =
    typeof setOptions === "function" ? setOptions : (_: string[]) => {};
  const safeSetEtcChecked =
    typeof setEtcChecked === "function" ? setEtcChecked : (_: boolean) => {};
  const safeSetOptionEtc =
    typeof setOptionEtc === "function" ? setOptionEtc : (_: string) => {};
  const legacyEtc = (optionEtc ?? "")
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);

  /** 프리셋 / 커스텀 분리 */
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

  // etcOn을 props + 현재 데이터로 계산
  const computedEtcOn = useMemo(() => {
    const hasLegacy = legacyEtc.length > 0; // optionEtc에 값이 있나
    const hasCustom = customFromOptions.length > 0; // 프리셋이 아닌 값이 있나
    return Boolean(etcChecked || hasLegacy || hasCustom);
  }, [etcChecked, legacyEtc.length, customFromOptions.length]);

  const [etcOn, setEtcOn] = useState<boolean>(computedEtcOn);
  useEffect(() => setEtcOn(computedEtcOn), [computedEtcOn]);

  /** 커스텀 입력 로컬 상태 */
  const [customInputs, setCustomInputs] = useState<string[]>(
    customFromOptions.length > 0 ? customFromOptions : []
  );
  const customInputsRef = useRef(customInputs);
  useEffect(() => {
    customInputsRef.current = customInputs;
  }, [customInputs]);

  /** 외부 -> 내부 반영에서 루프 방지 */
  const echoGuardRef = useRef(false);

  /** 외부 → 로컬 반영 (options가 바뀌면 커스텀 목록 동기화) */
  useEffect(() => {
    if (echoGuardRef.current) {
      echoGuardRef.current = false;
      return;
    }
    setCustomInputs(customFromOptions);
  }, [customFromOptions]);

  const absorbedRef = useRef(false);
  useEffect(() => {
    if (absorbedRef.current) return;
    if (legacyEtc.length && etcOn) {
      setCustomInputs((prev) => {
        const seen = new Set<string>();
        const merged = [...prev, ...legacyEtc].filter((v) => {
          const k = v.trim().toLowerCase();
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        return merged;
      });
      safeSetOptionEtc("");
      absorbedRef.current = true;
    }
  }, [etcOn, legacyEtc.length, safeSetOptionEtc]);

  /** 체크가 켜졌는데 입력이 0개면, 빈 인풋 1칸 자동 생성 */
  useEffect(() => {
    if (etcOn && customInputsRef.current.length === 0) {
      setCustomInputs([""]);
    }
  }, [etcOn]);

  /** options 동기화(프리셋 유지 + 커스텀 유니크) */
  const syncOptions = (nextCustomInputs: string[]) => {
    const seen = new Set<string>();
    const uniqCustoms: string[] = [];
    for (const v of nextCustomInputs) {
      const t = v.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      uniqCustoms.push(t);
    }
    const customsNotPreset = uniqCustoms.filter(
      (t) => !presetSet.has(t.toLowerCase())
    );
    echoGuardRef.current = true;
    safeSetOptions([...presetSelected, ...customsNotPreset]);
  };

  /** 프리셋 토글 */
  const togglePreset = (op: string) => {
    const isOn = safeOptions.includes(op);
    echoGuardRef.current = true;
    if (isOn) safeSetOptions(safeOptions.filter((x) => x !== op));
    else safeSetOptions([...safeOptions, op]);
  };

  /** onCheckedChange 값 보정 -> boolean */
  const toBool = (v: any, cur: boolean): boolean => {
    if (typeof v === "boolean") return v;
    if (v === "indeterminate") return true;
    if (v === "on") return !cur;
    if (v && typeof v === "object" && "target" in v) {
      const checked = (v as any)?.target?.checked;
      if (typeof checked === "boolean") return checked;
    }
    return !cur;
  };

  /** 직접입력 토글(내부/부모 동시 반영) */
  const toggleEtc = (val: any) => {
    const next = toBool(val, etcOn);
    setEtcOn(next);
    safeSetEtcChecked(next);
    if (!next) {
      // 끄면 커스텀 비우고 프리셋만 남김
      setCustomInputs([]);
      echoGuardRef.current = true;
      safeSetOptions(presetSelected);
    } else {
      // 켤 때 입력이 없으면 1칸 자동 생성
      setCustomInputs((prev) => (prev.length === 0 ? [""] : prev));
    }
  };

  /** 입력칸 조작 */
  const addCustomFieldAfter = (index?: number) => {
    if (!etcOn) {
      setEtcOn(true);
      safeSetEtcChecked(true);
    }
    setCustomInputs((prev) => {
      const copy = [...prev];
      const insertAt = typeof index === "number" ? index + 1 : copy.length;
      copy.splice(insertAt, 0, "");
      return copy;
    });
  };

  const removeCustomField = (idx: number) => {
    setCustomInputs((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      syncOptions(copy);
      return copy;
    });
  };

  const handleCustomChangeLocal = (idx: number, val: string) => {
    setCustomInputs((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const commitSync = () => {
    syncOptions(customInputsRef.current);
  };

  /** 2개씩 끊어 줄(row) */
  const rows: Array<[string | undefined, string | undefined]> = useMemo(() => {
    const r: Array<[string | undefined, string | undefined]> = [];
    for (let i = 0; i < customInputs.length; i += 2) {
      r.push([customInputs[i], customInputs[i + 1]]);
    }
    return r;
  }, [customInputs]);

  /** 레이아웃 클래스 */
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

      {/* 직접입력: 라벨을 각 줄의 첫 번째 셀로 배치(첫 줄만 체크박스/라벨, 이후 줄은 빈 자리) */}
      <div className="space-y-2">
        <div className="grid grid-cols-[auto_200px_200px_auto] md:grid-cols-[auto_220px_220px_auto] gap-x-2 gap-y-2 items-center">
          {etcOn && rows.length > 0 ? (
            <>
              {rows.map((pair, rowIdx) => {
                const isFirstRow = rowIdx === 0;
                const isLastRow = rowIdx === rows.length - 1;
                const [v1, v2] = pair;
                const baseIndex = rowIdx * 2;

                return (
                  <Fragment key={`row-${rowIdx}-${customInputs.length}`}>
                    {/* 1열: 첫 줄엔 체크박스/라벨, 이후 줄엔 자리만 유지 */}
                    <div className="min-h-9 flex items-center">
                      {isFirstRow ? (
                        <label className="inline-flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={etcOn}
                            onCheckedChange={toggleEtc}
                          />
                          <span
                            className="text-sm select-none cursor-pointer"
                            onClick={() => toggleEtc(!etcOn)}
                          >
                            직접입력
                          </span>
                        </label>
                      ) : (
                        <div className="h-9" />
                      )}
                    </div>

                    {/* 2열, 3열: 인풋 */}
                    <OptionCell
                      value={v1}
                      index={baseIndex}
                      placeholder="예: 노트북"
                      onChangeLocal={handleCustomChangeLocal}
                      onCommit={commitSync}
                      onRemove={removeCustomField}
                      onAddAfter={addCustomFieldAfter}
                      cellWidthBase={CELL_W_BASE}
                      cellWidthMd={CELL_W_MD}
                      inputWidthBase={INPUT_W_BASE}
                      inputWidthMd={INPUT_W_MD}
                    />
                    <OptionCell
                      value={v2}
                      index={baseIndex + 1}
                      placeholder="예: 데스크탑"
                      onChangeLocal={handleCustomChangeLocal}
                      onCommit={commitSync}
                      onRemove={removeCustomField}
                      onAddAfter={addCustomFieldAfter}
                      cellWidthBase={CELL_W_BASE}
                      cellWidthMd={CELL_W_MD}
                      inputWidthBase={INPUT_W_BASE}
                      inputWidthMd={INPUT_W_MD}
                    />

                    {/* 4열: 마지막 줄에만 + 버튼 */}
                    {isLastRow ? (
                      <div className="flex items-center justify-start">
                        <Button
                          type="button"
                          onClick={() =>
                            addCustomFieldAfter(
                              baseIndex + (v2 !== undefined ? 1 : 0)
                            )
                          }
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-blue-600 hover:bg-transparent"
                          title="입력칸 추가"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div />
                    )}
                  </Fragment>
                );
              })}
            </>
          ) : (
            // 꺼져 있거나, rows가 0일 때: 라벨은 항상 첫 칸에 보이고 인풋 칸은 비워둠
            <>
              <div className="min-h-9 flex items-center">
                <label className="inline-flex items-center gap-2 text-sm">
                  <Checkbox checked={etcOn} onCheckedChange={toggleEtc} />
                  <span
                    className="text-sm select-none cursor-pointer"
                    onClick={() => toggleEtc(!etcOn)}
                  >
                    직접입력
                  </span>
                </label>
              </div>
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
