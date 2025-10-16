"use client";

import { useCallback, useMemo, useState } from "react";
import { PinKind } from "@/features/pins/types";

export function useHeaderFields() {
  const [title, setTitle] = useState("");
  const [listingStars, setListingStars] = useState(0);
  const [elevator, setElevator] = useState<"O" | "X">("O");
  const [pinKind, setPinKind] = useState<PinKind>("1room");

  const state = useMemo(
    () => ({ title, listingStars, elevator, pinKind }),
    [title, listingStars, elevator, pinKind]
  );

  const actions = useMemo(
    () => ({ setTitle, setListingStars, setElevator, setPinKind }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
