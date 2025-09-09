"use client";
import StructureLinesList from "../components/StructureLinesList";

export default function StructureLinesListContainer({
  lines,
}: {
  lines: any[];
}) {
  return <StructureLinesList lines={Array.isArray(lines) ? lines : []} />;
}
