"use client";

import Image, { StaticImageData } from "next/image";
import SafeSelect from "@/features/safe/SafeSelect";

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
import duplexTerrace from "@/../public/pins/duplex-terrace-pin.svg";
import oldhouse from "@/../public/pins/oldhouse-pin.svg";
import question from "@/../public/pins/question-pin.svg";
import townhouse from "@/../public/pins/townhouse-pin.svg";

import type { PinKind } from "@/features/pins/types";

/** next/image src 타입 보조 */
type IconSrc = string | StaticImageData;

export const PIN_OPTIONS = [
  { value: "1room", label: "1룸~1.5룸", icon: oneRoom },
  { value: "1room-terrace", label: "1룸~1.5룸 (테라스)", icon: oneRoomTerrace },
  { value: "2room", label: "2룸~2.5룸", icon: twoRoom },
  { value: "2room-terrace", label: "2룸~2.5룸 (테라스)", icon: twoRoomTerrace },
  { value: "3room", label: "3룸", icon: threeRoom },
  { value: "3room-terrace", label: "3룸 (테라스)", icon: threeRoomTerrace },
  { value: "4room", label: "4룸", icon: fourRoom },
  { value: "4room-terrace", label: "4룸 (테라스)", icon: fourRoomTerrace },
  { value: "duplex", label: "복층", icon: duplex },
  { value: "duplex-terrace", label: "복층 (테라스)", icon: duplexTerrace },
  { value: "townhouse", label: "타운하우스", icon: townhouse },
  // { value: "oldhouse", label: "구옥", icon: oldhouse },
  { value: "question", label: "답사예정", icon: question },
  { value: "completed", label: "입주완료", icon: completed },
] as const;

/** 옵션 기반 타입 가드: unknown -> PinKind */
function isPinKind(v: unknown): v is PinKind {
  return (PIN_OPTIONS as readonly { value: string }[]).some(
    (o) => o.value === v
  );
}

function PinOptionView({ icon, label }: { icon: IconSrc; label: string }) {
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
  value: PinKind | null;
  onChange: (v: PinKind) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <SafeSelect
      value={value ?? undefined} // null이면 placeholder 보임
      onChange={(v) => {
        if (v == null) return;
        if (isPinKind(v)) onChange(v);
      }}
      items={PIN_OPTIONS.map((o) => ({
        value: o.value,
        label: <PinOptionView icon={o.icon} label={o.label} />,
      }))}
      placeholder={placeholder}
      className={className ?? "w-[220px] h-9"}
      contentClassName="z-[1100] max-h-[320px]"
    />
  );
}
