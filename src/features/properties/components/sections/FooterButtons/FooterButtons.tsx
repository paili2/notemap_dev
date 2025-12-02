"use client";

import { Check, Loader2, ArrowLeft } from "lucide-react";
import { FooterButtonsProps } from "./types";

export default function FooterButtons({
  onClose,
  onSave,
  canSave,
  isSaving = false,
}: FooterButtonsProps) {
  const canSaveNow = canSave && !isSaving;
  const canCancelNow = !isSaving;

  return (
    <div
      className="px-5 py-3 border-t flex items-center justify-between"
      aria-busy={isSaving ? "true" : "false"}
    >
      {/* 취소 (왼쪽) */}
      <button
        type="button"
        onClick={onClose}
        disabled={!canCancelNow}
        className={[
          "inline-flex items-center gap-2 rounded-md border px-3 h-9",
          "text-red-600",
          canCancelNow
            ? "hover:bg-red-50"
            : "opacity-50 cursor-not-allowed pointer-events-none",
        ].join(" ")}
        aria-label="취소"
        title="취소"
      >
        <ArrowLeft className="h-4 w-4" />
        취소
      </button>

      {/* 저장 (오른쪽) */}
      <button
        type="button"
        onClick={onSave}
        disabled={!canSaveNow}
        aria-disabled={!canSaveNow}
        className={[
          "inline-flex items-center gap-2 rounded-md border px-3 h-9",
          canSaveNow
            ? "text-blue-600 hover:bg-blue-50"
            : "text-blue-300 opacity-50 cursor-not-allowed pointer-events-none",
        ].join(" ")}
        aria-label="저장"
        title="저장"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            저장중…
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            저장
          </>
        )}
      </button>
    </div>
  );
}
