"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Check, Loader2 } from "lucide-react";

type Props = {
  onClose: () => void;
  onSave: () => void | Promise<void>;
  canSave: boolean;
};

export default function FooterButtons({ onClose, onSave, canSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    try {
      setIsSaving(true);
      await Promise.resolve(onSave());
    } catch (e) {
      // 필요하면 여기서 toast 처리해도 됨
      // toast.error("저장 중 오류가 발생했어요.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="px-5 py-3 border-t flex items-center justify-end gap-3"
      aria-busy={isSaving ? "true" : "false"}
    >
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSaving}
      >
        취소
      </Button>

      <Button
        type="button"
        onClick={handleSave}
        disabled={!canSave || isSaving}
        aria-disabled={!canSave || isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            저장중…
          </>
        ) : (
          <>
            <Check className="mr-1 h-4 w-4" />
            저장
          </>
        )}
      </Button>
    </div>
  );
}
