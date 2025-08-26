"use client";

import { Badge } from "@/components/atoms/Badge/Badge";

type Props = { options: string[]; optionEtc?: string };

export default function OptionsBadges({ options, optionEtc }: Props) {
  const base = (options ?? []).filter(Boolean);
  const etcTags = String(optionEtc ?? "")
    .split(/[,\uFF0C\u3001]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const all = Array.from(new Set([...base, ...etcTags]));
  if (all.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {all.map((op) => (
        <Badge key={op} variant="secondary">
          {op}
        </Badge>
      ))}
    </div>
  );
}
