"use client";
import { Phone } from "lucide-react";
import Field from "@/components/atoms/Field/Field";
import { Input } from "@/components/atoms/Input/Input";
import { formatPhone } from "@/lib/formatPhone";
import { BasicInfoSectionProps } from "./types";

export default function BasicInfoSection({
  address,
  setAddress,
  officePhone,
  setOfficePhone,
  officePhone2 = "",
  setOfficePhone2,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <Field label="주소">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="예: 서울 성동구 성수동1가 ..."
          className="h-9"
          readOnly={true}
          aria-readonly="true"
        />
      </Field>

      <Field label="분양사무실">
        <div className="w-full grid grid-cols-2 gap-5 md:gap-0">
          <Input
            value={officePhone}
            onChange={(e) => setOfficePhone(formatPhone(e.target.value))}
            placeholder="대표번호"
            className="md:w-2/3 h-9"
            inputMode="tel"
            leftIcon={<Phone className="w-4 h-4" />}
          />
          <Input
            value={officePhone2}
            onChange={(e) => setOfficePhone2(formatPhone(e.target.value))}
            placeholder="추가번호(선택)"
            className="md:w-2/3 h-9"
            inputMode="tel"
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>
      </Field>
    </div>
  );
}
