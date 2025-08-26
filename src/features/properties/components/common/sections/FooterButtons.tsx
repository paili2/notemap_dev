"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Check } from "lucide-react";

type Props = {
  onClose: () => void;
  onSave: () => void | Promise<void>;
  canSave: boolean;
};

export default function FooterButtons({ onClose, onSave, canSave }: Props) {
  return (
    <div className="px-5 py-3 border-t flex items-center justify-end gap-3">
      <Button variant="outline" onClick={onClose}>
        취소
      </Button>
      <Button onClick={onSave} disabled={!canSave}>
        <Check className="mr-1 h-4 w-4" />
        저장
      </Button>
    </div>
  );
}
