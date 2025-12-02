"use client";
import { EditFormAPI } from "@/features/properties/hooks/useEditForm/types";
import MemoSection from "../../../../sections/MemoSection/MemoSection";

export default function MemosContainer({ form }: { form: EditFormAPI }) {
  return (
    <div className="space-y-3">
      <MemoSection
        mode="KN"
        value={form.publicMemo}
        setValue={form.setPublicMemo}
      />
      <MemoSection
        mode="R"
        value={form.secretMemo}
        setValue={form.setSecretMemo}
      />
    </div>
  );
}
