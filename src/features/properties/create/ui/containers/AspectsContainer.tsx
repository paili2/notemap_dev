"use client";

import { useEffect, useRef } from "react";
import {
  type AspectRowLite,
  type OrientationValue,
} from "@/features/properties/types/property-domain";
import AspectsSection from "@/features/properties/components/sections/AspectsSection/AspectsSection";

type Props = {
  form: {
    aspects: AspectRowLite[];
    addAspect: () => void;
    removeAspect: (no: number) => void;
    setAspectDir: (no: number, dir: OrientationValue | "") => void;
  };
  /** 답사예정 핀 여부 */
  isVisitPlanPin?: boolean;
};

export default function AspectsContainer({ form, isVisitPlanPin }: Props) {
  const prevIsVisitRef = useRef(isVisitPlanPin);

  useEffect(() => {
    const prev = prevIsVisitRef.current;

    // 일반핀 → 답사예정으로 바뀌는 순간에만 향 초기화
    if (isVisitPlanPin && !prev) {
      const aspects = form.aspects ?? [];

      if (aspects.length > 0) {
        // 첫 번째 행의 방향만 비우고
        const first = aspects[0];
        form.setAspectDir(first.no, "");

        // 나머지 행들은 제거
        for (let i = 1; i < aspects.length; i++) {
          form.removeAspect(aspects[i].no);
        }
      }
    }

    prevIsVisitRef.current = isVisitPlanPin;
  }, [isVisitPlanPin, form]);

  return (
    <AspectsSection
      aspects={form.aspects}
      addAspect={form.addAspect}
      removeAspect={form.removeAspect}
      setAspectDir={form.setAspectDir}
    />
  );
}
