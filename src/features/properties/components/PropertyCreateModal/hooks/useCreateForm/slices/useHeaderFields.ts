"use client";

import { useMemo, useState } from "react";
import { PinKind } from "@/features/pins/types";
// (선택) 서버 enum과 맞추고 싶으면 타입을 따로 가져오세요.
// import { PinBadge } from "@/features/pins/types"; // 프로젝트에 있으면 사용

export function useHeaderFields() {
  const [title, setTitle] = useState("");
  const [listingStars, setListingStars] = useState(0);
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [pinKind, setPinKind] = useState<PinKind>("1room");

  // ✅ 추가: 배지 (초기 미선택 null)
  const [badge, setBadge] = useState<string | null>(null);
  // 만약 PinBadge enum을 사용한다면:
  // const [badge, setBadge] = useState<PinBadge | null>(null);

  const state = useMemo(
    () => ({ title, listingStars, elevator, pinKind, badge }),
    [title, listingStars, elevator, pinKind, badge]
  );

  const actions = useMemo(
    () => ({ setTitle, setListingStars, setElevator, setPinKind, setBadge }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
