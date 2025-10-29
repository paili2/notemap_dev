"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Plus } from "lucide-react";
import { OptionsSectionProps } from "./types";
import OptionCell from "./OptionCell";
import { Button } from "@/components/atoms/Button/Button";

/** 필요시 레거시 문자열 분리용 */
const SPLIT_RE = /[,\n;/]+/;

/** 공통 헬퍼 */
const normalize = (s: string) => s.trim().toLowerCase();
const isEtcLabel = (s: string) =>
  ["직접입력", "기타", "etc"].includes(normalize(s));

/** 얕은 배열 동일성(순서 포함) */
const arrShallowEqual = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** 유니크 + 트림 + 공백 제거 */
const dedupNormalized = (items: readonly string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of items) {
    const t = v.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
};

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
  const safeOptions = Array.isArray(options) ? options.map(String) : [];
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

  /** 프리셋에서 '직접입력/기타/etc' 제거 */
  const PRESETS_NO_ETC = useMemo(
    () => PRESET_OPTIONS.filter((op) => !isEtcLabel(op)),
    [PRESET_OPTIONS]
  );

  /** 프리셋 / 커스텀 분리 */
  const presetSet = useMemo(
    () => new Set(PRESETS_NO_ETC.map((v) => normalize(v))),
    [PRESETS_NO_ETC]
  );
  const presetSelected = useMemo(
    () => safeOptions.filter((v) => presetSet.has(normalize(v))),
    [safeOptions, presetSet]
  );
  const customFromOptions = useMemo(
    () => safeOptions.filter((v) => !presetSet.has(normalize(v))),
    [safeOptions, presetSet]
  );

  // etcOn을 props + 현재 데이터로 계산
  const computedEtcOn = useMemo(() => {
    const hasLegacy = legacyEtc.length > 0; // optionEtc에 값이 있나
    const hasCustom = customFromOptions.length > 0; // 프리셋이 아닌 값이 있나
    return Boolean(etcChecked || hasLegacy || hasCustom);
  }, [etcChecked, legacyEtc.length, customFromOptions.length]);

  const [etcOn, setEtcOn] = useState<boolean>(computedEtcOn);

  // ✅ 자동 OFF 금지: true일 때만 켜주고, false로 내려와도 자동으로 끄지 않음
  useEffect(() => {
    if (!etcOn && computedEtcOn) setEtcOn(true);
  }, [computedEtcOn, etcOn]);

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
    // 값이 같으면 set 생략
    if (!arrShallowEqual(customInputsRef.current, customFromOptions)) {
      setCustomInputs(customFromOptions);
    }
  }, [customFromOptions]);

  const absorbedRef = useRef(false);
  useEffect(() => {
    if (absorbedRef.current) return;
    if (legacyEtc.length && etcOn) {
      setCustomInputs((prev) => {
        const merged = dedupNormalized([...prev, ...legacyEtc]);
        if (arrShallowEqual(prev, merged)) return prev;
        return merged;
      });
      // 레거시 텍스트를 로컬로 흡수했으니 비워둠 (동일하면 생략)
      if ((optionEtc ?? "") !== "") safeSetOptionEtc("");
      absorbedRef.current = true;
    }
  }, [etcOn, legacyEtc.length, optionEtc, safeSetOptionEtc]);

  /** 체크가 켜졌는데 입력이 0개면, 빈 인풋 1칸 자동 생성 */
  useEffect(() => {
    if (etcOn && customInputsRef.current.length === 0) {
      setCustomInputs((prev) => (prev.length === 0 ? [""] : prev));
    }
  }, [etcOn]);

  /** options 동기화(프리셋 유지 + 커스텀 유니크)
   *  + 백엔드 extraOptionsText용 optionEtc도 동기화
   */
  const syncOptions = useCallback(
    (nextCustomInputs: string[]) => {
      const uniqCustoms = dedupNormalized(nextCustomInputs);
      const customsNotPreset = uniqCustoms.filter(
        (t) => !presetSet.has(t.toLowerCase())
      );

      // 🔹 options(string[]) 갱신 (변경시에만)
      const nextOptions = [...presetSelected, ...customsNotPreset];
      if (!arrShallowEqual(safeOptions, nextOptions)) {
        echoGuardRef.current = true;
        safeSetOptions(nextOptions);
      }

      // 🔹 extraOptionsText 동기화 (변경시에만)
      const nextEtc = customsNotPreset.join(", ");
      if ((optionEtc ?? "") !== nextEtc) {
        safeSetOptionEtc(nextEtc);
      }
    },
    [
      presetSelected,
      presetSet,
      safeOptions,
      safeSetOptions,
      optionEtc,
      safeSetOptionEtc,
    ]
  );

  /** 프리셋 토글 */
  const togglePreset = useCallback(
    (op: string) => {
      const isOn = safeOptions.includes(op);
      const next = isOn
        ? safeOptions.filter((x) => x !== op)
        : [...safeOptions, op];
      if (!arrShallowEqual(safeOptions, next)) {
        echoGuardRef.current = true;
        safeSetOptions(next);
      }
    },
    [safeOptions, safeSetOptions]
  );

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
  const toggleEtc = useCallback(
    (val: any) => {
      const next = toBool(val, etcOn);
      if (next !== etcOn) setEtcOn(next);
      if (next !== etcChecked) safeSetEtcChecked(next);

      if (!next) {
        // 끄면 커스텀 비우고 프리셋만 남김 + extraOptionsText 비움
        setCustomInputs((prev) => {
          const cleared = [""]; // 다음에 켰을 때 바로 보이게 준비
          if (!arrShallowEqual(prev, cleared)) return cleared;
          return prev;
        });
        const nextOptions = presetSelected;
        if (!arrShallowEqual(safeOptions, nextOptions)) {
          echoGuardRef.current = true;
          safeSetOptions(nextOptions);
        }
        if ((optionEtc ?? "") !== "") safeSetOptionEtc("");
      } else {
        // 켤 때 입력이 없으면 1칸 자동 생성
        setCustomInputs((prev) => (prev.length === 0 ? [""] : prev));
        // 켠 직후에는 사용자가 입력/커밋하면 syncOptions에서 optionEtc가 채워짐
      }
    },
    [
      etcOn,
      etcChecked,
      safeSetEtcChecked,
      presetSelected,
      safeOptions,
      safeSetOptions,
      optionEtc,
      safeSetOptionEtc,
    ]
  );

  /** 입력칸 조작 */
  const addCustomFieldAfter = useCallback(
    (index?: number) => {
      if (!etcOn) {
        if (!etcOn) setEtcOn(true);
        if (!etcChecked) safeSetEtcChecked(true);
        setCustomInputs((prev) => (prev.length === 0 ? [""] : prev));
      }
      setCustomInputs((prev) => {
        const copy = [...prev];
        const insertAt = typeof index === "number" ? index + 1 : copy.length;
        copy.splice(insertAt, 0, "");
        return copy;
      });
    },
    [etcOn, etcChecked, safeSetEtcChecked]
  );

  const removeCustomField = useCallback(
    (idx: number) => {
      setCustomInputs((prev) => {
        const copy = [...prev];
        copy.splice(idx, 1);
        // ✅ 최소 1칸은 유지
        if (copy.length === 0) copy.push("");
        syncOptions(copy);
        return copy;
      });
    },
    [syncOptions]
  );

  // 타이핑할 때마다 부모 상태도 동기화(동일하면 set 생략)
  const handleCustomChangeLocal = useCallback(
    (idx: number, val: string) => {
      setCustomInputs((prev) => {
        const next = [...prev];
        if (next[idx] === val) return prev;
        next[idx] = val;
        syncOptions(next);
        return next;
      });
    },
    [syncOptions]
  );

  const commitSync = useCallback(() => {
    syncOptions(customInputsRef.current);
  }, [syncOptions]);

  /** 2개씩 끊어 줄(row) */
  const rows: Array<[string | undefined, string | undefined]> = useMemo(() => {
    const r: Array<[string | undefined, string | undefined]> = [];
    for (let i = 0; i < customInputs.length; i += 2) {
      r.push([customInputs[i], customInputs[i + 1]]);
    }
    return r;
  }, [customInputs]);

  /** 레이아웃 클래스 (모바일 폭 축소) */
  const CELL_W_BASE = "w-[112px]";
  const CELL_W_MD = "md:w-[220px]";
  const INPUT_W_BASE = "w-[104px]";
  const INPUT_W_MD = "md:w-[180px]";

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">옵션</div>

      {/* 프리셋 (직접입력 제외 목록) */}
      <div className="grid grid-cols-3 gap-2 items-center">
        {PRESETS_NO_ETC.map((op) => (
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
        <div className="grid grid-cols-[auto_120px_120px_auto] md:grid-cols-[auto_220px_220px_auto] gap-x-7 gap-y-2 items-center">
          {etcOn ? (
            <>
              {rows.length === 0 ? (
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
                  {/* 2열: 첫 번째 인풋 */}
                  <OptionCell
                    value={""}
                    index={0}
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
                  {/* 3열 자리 */}
                  <div className={`h-9 ${CELL_W_BASE} ${CELL_W_MD}`} />
                  {/* 4열: + 버튼 */}
                  <div className="flex items-center justify-start">
                    <Button
                      type="button"
                      onClick={() => addCustomFieldAfter(0)}
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-blue-600 hover:bg-transparent"
                      title="입력칸 추가"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                rows.map((pair, rowIdx) => {
                  const isFirstRow = rowIdx === 0;
                  const isLastRow = rowIdx === rows.length - 1;
                  const [v1, v2] = pair;
                  const baseIndex = rowIdx * 2;
                  const rowKey = `row-${rowIdx}`;

                  return (
                    <Fragment key={rowKey}>
                      {/* 1열 */}
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

                      {/* 2열 */}
                      <OptionCell
                        value={v1 ?? ""}
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

                      {/* 3열 */}
                      {v2 !== undefined ? (
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
                      ) : (
                        <div className={`h-9 ${CELL_W_BASE} ${CELL_W_MD}`} />
                      )}

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
                })
              )}
            </>
          ) : (
            // 꺼져 있거나, rows가 0일 때
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
