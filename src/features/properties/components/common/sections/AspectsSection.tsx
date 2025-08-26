// 향

"use client";

import type {
  AspectRowLite,
  OrientationValue,
} from "@/features/properties/types/property-domain";
import Field from "../Field";
import AspectsEditor from "../AspectsEditor";

export default function AspectsSection({
  aspects,
  addAspect,
  removeAspect,
  setAspectDir,
}: {
  aspects: AspectRowLite[];
  addAspect: () => void;
  removeAspect: (no: number) => void;
  setAspectDir: (no: number, dir: OrientationValue | "") => void;
}) {
  return (
    <Field label="향">
      <AspectsEditor
        aspects={aspects}
        addAspect={addAspect}
        removeAspect={removeAspect}
        setAspectDir={setAspectDir}
      />
    </Field>
  );
}
