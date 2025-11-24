"use client";

import { useMemo, useState } from "react";
import { PinKind } from "@/features/pins/types";

export function useHeaderFields() {
  const [title, setTitle] = useState("");
  const [parkingGrade, setParkingGrade] = useState<
    "" | "1" | "2" | "3" | "4" | "5"
  >(""); // ⭐ 별점은 문자열만

  // 🔹 엘리베이터: 기본값 없이 null
  const [elevator, setElevator] = useState<"O" | "X" | null>(null);

  // ✅ 기본 핀 종류를 "답사예정(question)"으로 설정
  const [pinKind, setPinKind] = useState<PinKind>("question");

  // (옵션) 배지
  const [badge, setBadge] = useState<string | null>(null);

  const state = useMemo(
    () => ({ title, parkingGrade, elevator, pinKind, badge }),
    [title, parkingGrade, elevator, pinKind, badge]
  );

  const actions = useMemo(
    () => ({ setTitle, setParkingGrade, setElevator, setPinKind, setBadge }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
