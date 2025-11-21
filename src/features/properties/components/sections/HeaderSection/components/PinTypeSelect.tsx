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
import oldhouse from "@/../public/pins/oldhouse-pin.svg";
import question from "@/../public/pins/question-pin.svg";
import townhouse from "@/../public/pins/townhouse-pin.svg";

import type { PinKind } from "@/features/pins/types";
import { useEffect } from "react";

/** next/image src 타입 보조 */
type IconSrc = string | StaticImageData;

/** 옵션을 상수로 고정 → value가 문자열 리터럴 타입으로 유지됨 */
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
  { value: "townhouse", label: "타운하우스", icon: townhouse },
  // { value: "oldhouse", label: "구옥", icon: oldhouse },
  { value: "question", label: "답사예정", icon: question },
  { value: "completed", label: "입주완료", icon: completed },
] as const;

/** 옵션 기반 타입 가드: unknown -> PinKind */
function isPinKind(v: unknown): v is PinKind {
  // 프로젝트 전역 PinKind가 이 옵션들과 동일해야 합니다.
  // 다르면 features/pins/types의 PinKind 정의를 아래 value 집합과 동기화하세요.
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
  /** ✅ 폼에서 값이 비어 있으면 최초에 무조건 'question'(답사예정)으로 보정 */
  const effectiveValue: PinKind | null = (value ?? "question") as PinKind;

  // 폼 state 쪽도 동기화(처음 한 번만)
  useEffect(() => {
    if (value == null) {
      onChange("question");
    }
  }, [value, onChange]);

  return (
    <SafeSelect
      value={effectiveValue} // 값이 항상 존재하므로 placeholder는 안 보임
      onChange={(v) => {
        if (v == null) return; // placeholder 선택 → 무시
        if (isPinKind(v)) onChange(v); // 타입 안전 전달
      }}
      items={PIN_OPTIONS.map((o) => ({
        value: o.value, // 문자열 리터럴 그대로
        label: <PinOptionView icon={o.icon} label={o.label} />,
      }))}
      placeholder={placeholder}
      className={className ?? "w-[220px] h-9"}
      contentClassName="z-[1100] max-h-[320px]"
    />
  );
}
