"use client";

export default function OptionsBadges({
  options,
  optionEtc,
}: {
  options: string[];
  optionEtc?: string;
}) {
  const list = Array.isArray(options) ? options.slice() : [];
  if (optionEtc && !list.includes(optionEtc)) list.push(optionEtc);

  if (list.length === 0)
    return (
      <div className="text-sm">
        <span className="text-muted-foreground">옵션</span>
        <div className="mt-1 text-muted-foreground">-</div>
      </div>
    );

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">옵션</div>
      <div className="flex flex-wrap gap-2">
        {list.map((op, i) => (
          <span
            key={`${op}-${i}`}
            className="inline-flex items-center rounded-full bg-green-50 text-green-700 text-sm p-3 h-6 border"
          >
            {op}
          </span>
        ))}
      </div>
    </div>
  );
}
