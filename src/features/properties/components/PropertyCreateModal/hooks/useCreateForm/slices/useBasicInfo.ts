"use client";

import { todayYmdKST } from "@/shared/date/todayYmdKST";
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

  // ✅ 건물유형(백엔드 enum: "APT" | "OP" | "주택" | "근생")
  const [buildingType, setBuildingType] = useState<string | null>(null);

  // ✅ 매물등록일 기본값: 오늘(KST, YYYY-MM-DD)
  const [completionDate, setCompletionDate] = useState<string>(todayYmdKST());

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
      buildingType,
      completionDate,
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
      buildingType,
      completionDate,
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
      setBuildingType,
      setCompletionDate,
    }),
    []
  );

  return useMemo(() => ({ state, actions }), [state, actions]);
}
