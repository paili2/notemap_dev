"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { EMPTY_ASPECTS } from "./constants";
import type { AspectRowLite, OrientationValue } from "./types";
import { buildOrientationFields } from "@/features/properties/lib/orientation";

/** 방향(aspects) 관련 상태 + 파생값 + 헬퍼 전담 훅 */
export function useAspectsState() {
  const [aspects, setAspects] = useState<AspectRowLite[]>(EMPTY_ASPECTS);

  // 편집 여부 플래그
  const aspectsTouchedRef = useRef(false);
  const [aspectsTouched, setAspectsTouched] = useState(false);

  const markAspectsTouched = useCallback(() => {
    if (!aspectsTouchedRef.current) {
      aspectsTouchedRef.current = true;
      setAspectsTouched(true);
    }
  }, []);

  const addAspect = useCallback(() => {
    markAspectsTouched();
    setAspects((prev) => [...prev, { no: prev.length + 1, dir: "" }]);
  }, [markAspectsTouched]);

  const removeAspect = useCallback(
    (no: number) => {
      markAspectsTouched();
      setAspects((prev) =>
        prev.filter((r) => r.no !== no).map((r, i) => ({ ...r, no: i + 1 }))
      );
    },
    [markAspectsTouched]
  );

  const setAspectDir = useCallback(
    (no: number, dir: OrientationValue | "") => {
      markAspectsTouched();
      setAspects((prev) => prev.map((r) => (r.no === no ? { ...r, dir } : r)));
    },
    [markAspectsTouched]
  );

  const aspectsValid = useMemo(
    () =>
      aspects.filter(
        (a) => typeof a.dir === "string" && a.dir.trim().length > 0
      ).length > 0,
    [aspects]
  );

  const buildOrientation = useCallback(
    () => buildOrientationFields(aspects),
    [aspects]
  );

  return {
    aspects,
    setAspects,
    aspectsTouchedRef,
    aspectsTouched,
    setAspectsTouched,
    markAspectsTouched,
    addAspect,
    removeAspect,
    setAspectDir,
    aspectsValid,
    buildOrientation,
  } as const;
}
