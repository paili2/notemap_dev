"use client";

import { useMemo, useState } from "react";
import { PinKind } from "@/features/pins/types";

export function useHeaderFields() {
  const [title, setTitle] = useState("");
  const [parkingGrade, setParkingGrade] = useState<
    "" | "1" | "2" | "3" | "4" | "5"
  >("");

  const [elevator, setElevator] = useState<"O" | "X" | null>(null);

  // ✅ 기본 핀 종류는 "미선택" (null)
  const [pinKind, setPinKind] = useState<PinKind | null>(null);

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
