"use client";

import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";

import oneRoom from "@/../public/pins/1room-pin.svg";
import oneRoomTerrace from "@/../public/pins/1room-terrace-pin.svg";
import twoRoom from "@/../public/pins/2room-pin.svg";
import twoRoomTerrace from "@/../public/pins/2room-terrace-pin.svg";
import threeRoom from "@/../public/pins/3room-pin.svg";
import threeRoomTerrace from "@/../public/pins/3room-terrace-pin.svg";
import fourRoom from "@/../public/pins/4room-pin.svg";
import fourRoomTerrace from "@/../public/pins/4room-terrace-pin.svg";
import completed from "@/../public/pins/completed-pin.svg";
import duplex from "@/../public/pins/duplex-pin.svg";
import oldhouse from "@/../public/pins/oldhouse-pin.svg";
import question from "@/../public/pins/question-pin.svg";
import townhouse from "@/../public/pins/townhouse-pin.svg";
import { PinKind } from "@/features/pins/types";

const PIN_OPTIONS = [
  { value: "1room", label: "1룸~1.5룸", icon: oneRoom },
  { value: "1room-terrace", label: "1룸~1.5룸 (테라스)", icon: oneRoomTerrace },
  { value: "2room", label: "2룸~2.5룸", icon: twoRoom },
  { value: "2room-terrace", label: "2룸~2.5룸 (테라스)", icon: twoRoomTerrace },
  { value: "3room", label: "3룸", icon: threeRoom },
  { value: "3room-terrace", label: "3룸 (테라스)", icon: threeRoomTerrace },
  { value: "4room", label: "4룸", icon: fourRoom },
  { value: "4room-terrace", label: "4룸 (테라스)", icon: fourRoomTerrace },
  { value: "duplex", label: "복층", icon: duplex },
  { value: "townhouse", label: "타운하우스", icon: townhouse },
  { value: "oldhouse", label: "구옥", icon: oldhouse },
  { value: "question", label: "답사예정", icon: question },
  { value: "completed", label: "입주완료", icon: completed },
];

function PinOptionView({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Image src={icon} alt="" width={18} height={18} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default function PinTypeSelect({
  value,
  onChange,
  className,
  placeholder = "핀 종류 선택",
}: {
  value: PinKind;
  onChange: (v: PinKind) => void;
  className?: string;
  placeholder?: string;
}) {
  const selected = PIN_OPTIONS.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={(v) => onChange(v as PinKind)}>
      <SelectTrigger className={className ?? "w-[220px] h-9"}>
        <SelectValue
          placeholder={placeholder}
          // 트리거에도 아이콘+라벨 표시
          aria-label={selected?.label}
        >
          {selected ? (
            <PinOptionView icon={selected.icon} label={selected.label} />
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[320px]">
        {PIN_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <PinOptionView icon={o.icon} label={o.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
