"use client";
import MemoSection from "@/features/properties/components/sections/MemoSection/MemoSection";
import { EditFormAPI } from "@/features/properties/edit/types/editForm.slices";

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
