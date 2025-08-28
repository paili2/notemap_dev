"use client";
import { Phone } from "lucide-react";
import Field from "../Field";
import { Input } from "@/components/atoms/Input/Input";
import { formatPhone } from "@/features/properties/lib/formatPhone";

type Props = {
  address: string;
  setAddress: (v: string) => void;
  officePhone: string;
  setOfficePhone: (v: string) => void;
  officePhone2: string;
  setOfficePhone2: (v: string) => void;
};

export default function BasicInfoSection({
  address,
  setAddress,
  officePhone,
  setOfficePhone,
  officePhone2,
  setOfficePhone2,
}: Props) {
  return (
    <div className="space-y-6">
      <Field label="주소">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="예: 서울 성동구 성수동1가 ..."
          className="h-9"
        />
      </Field>

      <Field label="분양사무실">
        <div className="flex gap-2">
          <Input
            value={officePhone}
            onChange={(e) => setOfficePhone(formatPhone(e.target.value))}
            placeholder="대표번호"
            className="h-9"
            inputMode="tel"
            leftIcon={<Phone className="w-4 h-4" />}
          />
          <Input
            value={officePhone2}
            onChange={(e) => setOfficePhone2(formatPhone(e.target.value))}
            placeholder="추가번호(선택)"
            className="h-9"
            inputMode="tel"
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>
      </Field>
    </div>
  );
}
