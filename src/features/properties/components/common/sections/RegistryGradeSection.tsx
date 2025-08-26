"use client";

import { Button } from "@/components/atoms/Button/Button";
import Field from "../../common/Field";
import type {
  Grade,
  Registry,
} from "@/features/properties/types/property-domain";

type Props = {
  REGISTRY_LIST: readonly string[];
  registry?: Registry;
  setRegistry: (v: Registry) => void;
  slopeGrade?: Grade;
  setSlopeGrade: (g: Grade | undefined) => void;
  structureGrade?: Grade;
  setStructureGrade: (g: Grade | undefined) => void;
};

export default function RegistryGradeSection({
  REGISTRY_LIST,
  registry,
  setRegistry,
  slopeGrade,
  setSlopeGrade,
  structureGrade,
  setStructureGrade,
}: Props) {
  const list = REGISTRY_LIST ?? []; // ← 방어 코드
  return (
    <div className="space-y-6">
      {/* 등기 */}
      <Field label="등기">
        <div className="flex flex-wrap gap-3">
          {REGISTRY_LIST.map((r) => (
            <label
              key={r}
              className="inline-flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="registry"
                value={r}
                checked={registry === (r as Registry)}
                onChange={(e) => setRegistry(e.target.value as Registry)}
                className="sr-only peer"
              />
              <span
                className="inline-grid h-4 w-4 place-items-center rounded-full border border-blue-500
                               before:content-[''] before:block before:h-2 before:w-2 before:rounded-full
                               before:bg-blue-600 before:scale-0 peer-checked:before:scale-100"
              />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>
      </Field>

      {/* 경사도 / 구조(등급) */}
      <div className="grid grid-cols-2 gap-6">
        <Field label="경사도">
          <div className="flex items-center gap-1">
            {(["상", "중", "하"] as Grade[]).map((g) => (
              <Button
                key={g}
                size="sm"
                type="button"
                variant={slopeGrade === g ? "default" : "outline"}
                className="px-3"
                onClick={() => setSlopeGrade(g)}
              >
                {g}
              </Button>
            ))}
            {slopeGrade && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSlopeGrade(undefined)}
              >
                초기화
              </Button>
            )}
          </div>
        </Field>

        <Field label="구조(등급)">
          <div className="flex items-center gap-1">
            {(["상", "중", "하"] as Grade[]).map((g) => (
              <Button
                key={g}
                size="sm"
                type="button"
                variant={structureGrade === g ? "default" : "outline"}
                className="px-3"
                onClick={() => setStructureGrade(g)}
              >
                {g}
              </Button>
            ))}
            {structureGrade && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStructureGrade(undefined)}
              >
                초기화
              </Button>
            )}
          </div>
        </Field>
      </div>
    </div>
  );
}
