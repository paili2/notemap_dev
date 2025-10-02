import type { MapMenuKey } from "../components/MapMenu/types/types";

export type Pin = {
  id: string | number;
  building?: { grade?: "new" | "old" | string };
  visit?: {
    planned?: boolean; // 답사예정 등록됨
    reserved?: boolean; // 답사지예약 등록됨 (또는 reservation 객체 존재 여부)
    reservation?: unknown; // reserved 대신 reservation 객체를 쓰는 경우 대비
  };
};

export function filterPinsByMenuKey<T extends Pin>(
  pins: T[],
  key: MapMenuKey
): T[] {
  switch (key) {
    case "all":
      return pins;
    case "new":
      return pins.filter((p) => p.building?.grade === "new");
    case "old":
      return pins.filter((p) => p.building?.grade === "old");
    case "plannedOnly":
      // “답사예정 등록 O” && “답사지예약 등록 X”
      return pins.filter((p) => {
        const planned = p.visit?.planned === true;
        const hasReservationFlag = p.visit?.reserved === true;
        const hasReservationObj = !!p.visit?.reservation;
        return planned && !hasReservationFlag && !hasReservationObj;
      });
    default:
      return pins;
  }
}
