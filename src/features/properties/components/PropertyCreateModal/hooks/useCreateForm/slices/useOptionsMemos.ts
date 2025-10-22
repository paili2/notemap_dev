"use client";

import { useMemo, useState } from "react";

export function useOptionsMemos() {
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [optionEtc, setOptionEtc] = useState("");
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");

  const state = useMemo(
    () => ({ options, etcChecked, optionEtc, publicMemo, secretMemo }),
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
