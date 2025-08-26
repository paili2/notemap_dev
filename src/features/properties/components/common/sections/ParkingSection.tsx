// 주차유형 + 별점

"use client";

import { Input } from "@/components/atoms/Input/Input";
import Field from "../Field";
import StarsRating from "../StarsRating";

/** 주차 유형 + 별점 입력 섹션 */
export default function ParkingSection({
  parkingType,
  setParkingType,
  parkingStars,
  setParkingStars,
}: {
  parkingType: string;
  setParkingType: (v: string) => void;
  parkingStars: number;
  setParkingStars: (n: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Field label="주차유형">
        <Input
          value={parkingType}
          onChange={(e) => setParkingType(e.target.value)}
          placeholder="ex) 답사지 확인"
          className="h-9"
        />
      </Field>
      <Field label="주차평점">
        <StarsRating value={parkingStars} onChange={setParkingStars} />
      </Field>
    </div>
  );
}
