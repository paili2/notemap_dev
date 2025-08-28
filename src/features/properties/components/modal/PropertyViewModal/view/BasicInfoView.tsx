// features/properties/components/modal/PropertyViewModal/view/BasicInfoView.tsx
"use client";

import Field from "../../common/Field";

export default function BasicInfoView({
  address,
  officePhone,
  officePhone2,
}: {
  address: string;
  officePhone: string;
  officePhone2?: string;
}) {
  return (
    <div className="space-y-6">
      <Field label="주소">
        <div className="h-9 flex items-center text-sm text-slate-800">
          {address || "-"}
        </div>
      </Field>

      <Field label="분양사무실">
        <div className="h-9 flex items-center text-sm text-slate-800">
          {[officePhone, officePhone2].filter(Boolean).join(" / ") || "-"}
        </div>
      </Field>
    </div>
  );
}
