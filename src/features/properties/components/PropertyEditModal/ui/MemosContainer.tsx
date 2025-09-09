"use client";
import MemoSection from "../../sections/MemoSection/MemoSection";
import type { EditFormAPI } from "../hooks/useEditForm";

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
