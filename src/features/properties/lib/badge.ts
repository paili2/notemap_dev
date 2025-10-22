export function mapPinKindToBadge(
  pinKind: string,
  opts?: { terrace?: boolean }
): string | null {
  const t = !!opts?.terrace;
  switch (pinKind) {
    case "1room":
      return t ? "R1_TO_1_5_TERRACE" : "R1_TO_1_5";
    case "2room":
      return t ? "R2_TO_2_5_TERRACE" : "R2_TO_2_5";
    case "3room":
      return t ? "R3_TERRACE" : "R3";
    case "4room":
      return t ? "R4_TERRACE" : "R4";
    case "loft":
      return "LOFT";
    case "townhouse":
      return "TOWNHOUSE";
    case "old_house":
      return "OLD_HOUSE";
    case "survey":
      return "SURVEY_SCHEDULED";
    case "moved_in":
      return "MOVE_IN_COMPLETE";
    default:
      return null;
  }
}
