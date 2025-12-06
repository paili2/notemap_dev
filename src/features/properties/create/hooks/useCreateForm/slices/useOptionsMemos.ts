"use client";

import { useMemo, useState } from "react";

export function useOptionsMemos() {
  const [options, setOptions] = useState<string[]>([]);
  const [etcChecked, setEtcChecked] = useState(false);
  const [publicMemo, setPublicMemo] = useState("");
  const [secretMemo, setSecretMemo] = useState("");

  const state = useMemo(
    () => ({
      options,
      etcChecked,
      publicMemo,
      secretMemo,
    }),
    [options, etcChecked, publicMemo, secretMemo]
  );

  const actions = useMemo(
    () => ({
      setOptions,
      setEtcChecked,
      setPublicMemo,
      setSecretMemo,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
