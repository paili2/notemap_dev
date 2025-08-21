"use client";

import * as React from "react";
import type { OrientationRow } from "@/features/properties/types/property-domain";

export type OrientationBadgesProps = {
  data?: OrientationRow[] | null;
  className?: string;
};

export default function OrientationBadges({
  data,
  className,
}: OrientationBadgesProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        저장된 향 정보가 없습니다.
      </p>
    );
  }
  return (
    <div className={className ?? "flex flex-wrap gap-2"}>
      {data.map((o) => (
        <span
          key={o.ho}
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
        >
          {o.ho}호: {o.value || "-"}
        </span>
      ))}
    </div>
  );
}
