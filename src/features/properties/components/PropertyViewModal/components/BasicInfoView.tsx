"use client";

import Field from "@/components/atoms/Field/Field";

interface BasicInfoViewProps {
  address?: string;
  officePhone?: string; // 대표번호
  officePhone2?: string; // 추가번호(선택)
}

export default function BasicInfoView({
  address,
  officePhone,
  officePhone2,
}: BasicInfoViewProps) {
  return (
    <div className="space-y-6">
      {/* 주소 */}
      <Field label="주소">
        <div className="h-9 flex items-center text-sm text-slate-800">
          {(address ?? "").trim() || "-"}
        </div>
      </Field>

      {/* 분양사무실 번호 */}
      <Field label="분양사무실">
        <div className="h-9 flex items-center text-sm text-slate-800">
          {[officePhone, officePhone2].filter(Boolean).join(" / ") || "-"}
        </div>
      </Field>
    </div>
  );
}
