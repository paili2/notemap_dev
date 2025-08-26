"use client";
import Field from "../../common/Field";
import { Input } from "@/components/atoms/Input/Input";

type Props = {
  title: string;
  setTitle: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  officePhone: string;
  setOfficePhone: (v: string) => void;
  officePhone2: string;
  setOfficePhone2: (v: string) => void;
};

export default function BasicInfoSection({
  title,
  setTitle,
  address,
  setAddress,
  officePhone,
  setOfficePhone,
  officePhone2,
  setOfficePhone2,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2">
        <Field label="매물명">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 성수 리버뷰 84A"
            className="h-9"
          />
        </Field>
      </div>

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
            onChange={(e) => setOfficePhone(e.target.value)}
            placeholder="대표번호"
            className="h-9"
            inputMode="tel"
          />
          <Input
            value={officePhone2}
            onChange={(e) => setOfficePhone2(e.target.value)}
            placeholder="추가번호(선택)"
            className="h-9"
            inputMode="tel"
          />
        </div>
      </Field>
    </div>
  );
}
