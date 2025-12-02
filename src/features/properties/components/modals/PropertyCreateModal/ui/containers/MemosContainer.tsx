"use client";

import MemoSection from "../../../../sections/MemoSection/MemoSection";

export default function MemosContainer({
  form,
}: {
  form: {
    publicMemo: string;
    setPublicMemo: (v: string) => void;
    secretMemo: string;
    setSecretMemo: (v: string) => void;
  };
}) {
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
