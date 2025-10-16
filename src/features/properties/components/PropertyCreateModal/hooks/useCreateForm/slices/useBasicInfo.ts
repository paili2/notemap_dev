"use client";

import { useEffect, useMemo, useState } from "react";

export function useBasicInfo({ initialAddress }: { initialAddress?: string }) {
  const [address, setAddress] = useState("");
  useEffect(() => {
    setAddress(initialAddress ?? "");
  }, [initialAddress]);

  const [officePhone, setOfficePhone] = useState("");
  const [officePhone2, setOfficePhone2] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [floor, setFloor] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [structure, setStructure] = useState("3룸");

  const state = useMemo(
    () => ({
      address,
      officePhone,
      officePhone2,
      officeName,
      moveIn,
      floor,
      roomNo,
      structure,
    }),
    [
      address,
      officePhone,
      officePhone2,
      officeName,
      moveIn,
      floor,
      roomNo,
      structure,
    ]
  );

  const actions = useMemo(
    () => ({
      setAddress,
      setOfficePhone,
      setOfficePhone2,
      setOfficeName,
      setMoveIn,
      setFloor,
      setRoomNo,
      setStructure,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
