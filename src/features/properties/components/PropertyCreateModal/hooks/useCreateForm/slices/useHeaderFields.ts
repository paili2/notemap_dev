"use client";

import { useMemo, useState } from "react";
import { PinKind } from "@/features/pins/types";

export function useHeaderFields() {
  const [title, setTitle] = useState("");
  const [parkingGrade, setParkingGrade] = useState<
    "" | "1" | "2" | "3" | "4" | "5"
  >("");

  const [elevator, setElevator] = useState<"O" | "X" | null>(null);
  const [pinKind, setPinKind] = useState<PinKind | null>(null);
  const [badge, setBadge] = useState<string | null>(null);

  // 🔥 헤더 R 인풋의 원본 텍스트
  const [rebateRaw, setRebateRaw] = useState<string>("");

  const state = useMemo(
    () => ({ title, parkingGrade, elevator, pinKind, badge, rebateRaw }),
    [title, parkingGrade, elevator, pinKind, badge, rebateRaw]
  );

  const actions = useMemo(
    () => ({
      setTitle,
      setParkingGrade,
      setElevator,
      setPinKind,
      setBadge,
      setRebateRaw,
    }),
    [setTitle, setParkingGrade, setElevator, setPinKind, setBadge, setRebateRaw]
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
