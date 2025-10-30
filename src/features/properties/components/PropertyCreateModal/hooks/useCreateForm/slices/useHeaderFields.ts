"use client";

import { useMemo, useState } from "react";
import { PinKind } from "@/features/pins/types";

export function useHeaderFields() {
  const [title, setTitle] = useState("");
  const [parkingGrade, setParkingGrade] = useState<
    "" | "1" | "2" | "3" | "4" | "5"
  >(""); // ⭐ 별점은 문자열만
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [pinKind, setPinKind] = useState<PinKind>("1room");

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
