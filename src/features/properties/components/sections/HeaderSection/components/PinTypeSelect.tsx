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
import duplexTerrace from "@/../public/pins/duplex-terrace-pin.svg"; // 🔹 복층 테라스
import question from "@/../public/pins/question-pin.svg";
import townhouse from "@/../public/pins/townhouse-pin.svg";

// 🔹 구옥용 아이콘들
import oldOneRoom from "@/../public/pins/old-1room-pin.svg";
import oldTwoRoom from "@/../public/pins/old-2room-pin.svg";
import oldThreeRoom from "@/../public/pins/old-3room-pin.svg";
import oldFourRoom from "@/../public/pins/old-4room-pin.svg";
import oldDuplex from "@/../public/pins/old-duplex-pin.svg";
import oldTownhouse from "@/../public/pins/old-townhouse-pin.svg";

import type { PinKind } from "@/features/pins/types";
import type { BuildingGrade } from "@/features/properties/types/building-grade";

/** next/image src 타입 보조 */
type IconSrc = string | StaticImageData;

/**
 * 🔸 PinKind 타입과 1:1로 맞춘 기본 옵션
 */
const PIN_OPTION_BASE = [
  { value: "1room", label: "1룸~1.5룸" },
  { value: "1room-terrace", label: "1룸~1.5룸 (테라스)" },
  { value: "2room", label: "2룸~2.5룸" },
  { value: "2room-terrace", label: "2룸~2.5룸 (테라스)" },
  { value: "3room", label: "3룸" },
  { value: "3room-terrace", label: "3룸 (테라스)" },
  { value: "4room", label: "4룸" },
  { value: "4room-terrace", label: "4룸 (테라스)" },
  { value: "duplex", label: "복층" },
  { value: "duplex-terrace", label: "복층 (테라스)" },
  { value: "townhouse", label: "타운하우스" },
  { value: "question", label: "답사예정" },
  { value: "completed", label: "입주완료" },
] as const;

/** 옵션 기반 타입 가드: unknown -> PinKind */
function isPinKind(v: unknown): v is PinKind {
  return (PIN_OPTION_BASE as readonly { value: string }[]).some(
    (o) => o.value === v
  );
}

/** 🔧 신축/구옥에 따라 아이콘 선택 */
function getIconFor(
  value: PinKind,
  buildingGrade: BuildingGrade | null
): IconSrc {
  const isOld = buildingGrade === "old";

  switch (value) {
    // 1룸 계열
    case "1room":
      return isOld ? oldOneRoom : oneRoom;
    case "1room-terrace":
      // 구옥: 테라스 핀 따로 없음 → 일반 구옥핀 재사용
      return isOld ? oldOneRoom : oneRoomTerrace;

    // 2룸 계열
    case "2room":
      return isOld ? oldTwoRoom : twoRoom;
    case "2room-terrace":
      return isOld ? oldTwoRoom : twoRoomTerrace;

    // 3룸 계열
    case "3room":
      return isOld ? oldThreeRoom : threeRoom;
    case "3room-terrace":
      return isOld ? oldThreeRoom : threeRoomTerrace;

    // 4룸 계열
    case "4room":
      return isOld ? oldFourRoom : fourRoom;
    case "4room-terrace":
      return isOld ? oldFourRoom : fourRoomTerrace;

    // 복층 계열
    case "duplex":
      return isOld ? oldDuplex : duplex;
    case "duplex-terrace":
      // 🔹 구옥: 복층 테라스도 일반 구옥 복층핀과 동일
      return isOld ? oldDuplex : duplexTerrace;

    // 타운하우스
    case "townhouse":
      return isOld ? oldTownhouse : townhouse;

    // 답사예정 / 입주완료는 공용
    case "question":
      return question;
    case "completed":
      return completed;
  }
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
  /** 신축/구옥에 따라 아이콘만 변경 */
  buildingGrade = null,
}: {
  value: PinKind | null;
  onChange: (v: PinKind) => void;
  className?: string;
  placeholder?: string;
  buildingGrade?: BuildingGrade | null;
}) {
  const items = PIN_OPTION_BASE.map((o) => {
    const icon = getIconFor(o.value as PinKind, buildingGrade ?? null);
    return {
      value: o.value,
      label: <PinOptionView icon={icon} label={o.label} />,
    };
  });

  return (
    <SafeSelect
      value={value ?? undefined} // null이면 placeholder 보임
      onChange={(v) => {
        if (v == null) return;
        if (isPinKind(v)) onChange(v);
      }}
      items={items}
      placeholder={placeholder}
      className={className ?? "w-[220px] h-9"}
      contentClassName="z-[1100] max-h-[320px]"
    />
  );
}
