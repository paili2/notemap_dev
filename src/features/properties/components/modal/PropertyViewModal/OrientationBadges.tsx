import * as React from "react";
import type { OrientationRow } from "@/features/properties/types/property-domain";

export default function OrientationBadges({
  data,
}: {
  data?: OrientationRow[] | null;
}) {
  if (!data?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((o) => (
        <span
          key={o.ho}
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
        >
          {o.ho}호: {o.value}
        </span>
      ))}
    </div>
  );
}
