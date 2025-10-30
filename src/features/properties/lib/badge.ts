// src/features/properties/lib/badge.ts (예시 경로)
import type { PinKind } from "@/features/pins/types";

/** PinKind -> 서버 badge */
export function mapPinKindToBadge(pinKind: PinKind): string | null {
  switch (pinKind) {
    case "1room":
      return "R1_TO_1_5";
    case "1room-terrace":
      return "R1_TO_1_5_TERRACE";
    case "2room":
      return "R2_TO_2_5";
    case "2room-terrace":
      return "R2_TO_2_5_TERRACE";
    case "3room":
      return "R3";
    case "3room-terrace":
      return "R3_TERRACE";
    case "4room":
      return "R4";
    case "4room-terrace":
      return "R4_TERRACE";
    case "duplex":
      return "LOFT";
    case "townhouse":
      return "TOWNHOUSE";
    case "oldhouse":
      return "OLD_HOUSE";
    case "question":
      return "SURVEY_SCHEDULED";
    case "completed":
      return "MOVE_IN_COMPLETE";
    default:
      return null;
  }
}

/** 서버 badge -> PinKind */
export function mapBadgeToPinKind(badge?: string | null): PinKind | undefined {
  const b = (badge ?? "").toUpperCase();
  if (!b) return undefined;

  switch (b) {
    case "R1_TO_1_5":
      return "1room";
    case "R1_TO_1_5_TERRACE":
      return "1room-terrace";
    case "R2_TO_2_5":
      return "2room";
    case "R2_TO_2_5_TERRACE":
      return "2room-terrace";
    case "R3":
      return "3room";
    case "R3_TERRACE":
      return "3room-terrace";
    case "R4":
      return "4room";
    case "R4_TERRACE":
      return "4room-terrace";
    case "LOFT":
      return "duplex";
    case "TOWNHOUSE":
      return "townhouse";
    case "OLD_HOUSE":
      return "oldhouse";
    case "SURVEY_SCHEDULED":
      return "question";
    case "MOVE_IN_COMPLETE":
      return "completed";
    default:
      return undefined; // 매핑 없으면 undefined
  }
}
