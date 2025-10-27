"use client";

import { useMemo, useState, useEffect } from "react";

export function useOptionsMemos() {
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");

  // 🔹 optionEtc 실시간 동기화용 (직접입력 시 즉시 반영)
  useEffect(() => {
    if (etcChecked && optionEtc.trim().length > 0) {
      // 옵션 문자열이 비어 있지 않으면 자동으로 등재
      // (OptionsSection에서 setOptions와 함께 연동되므로 별도 처리는 필요 없음)
    }
  }, [optionEtc, etcChecked]);

  const state = useMemo(
    () => ({
      options,
      etcChecked,
      optionEtc,
      publicMemo,
      secretMemo,
    }),
    [options, etcChecked, optionEtc, publicMemo, secretMemo]
  );

  const actions = useMemo(
    () => ({
      setOptions,
      setEtcChecked,
      setOptionEtc,
      setPublicMemo,
      setSecretMemo,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
