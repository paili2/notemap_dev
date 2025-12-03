"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  AspectRowLite,
  OrientationValue,
} from "@/features/properties/types/property-domain";

export function useAspects() {
  const [aspects, setAspects] = useState<AspectRowLite[]>([{ no: 1, dir: "" }]);

  const addAspect = useCallback(
    () => setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]),
    []
  );
  const removeAspect = useCallback(
    (no: number) =>
      setAspects((prev) =>
        prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
      ),
    []
  );
  const setAspectDir = useCallback(
    (no: number, dir: OrientationValue | "") =>
      setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r))),
    []
  );

  const state = useMemo(() => ({ aspects }), [aspects]);
  const actions = useMemo(
    () => ({ addAspect, removeAspect, setAspectDir }),
    [addAspect, removeAspect, setAspectDir]
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
