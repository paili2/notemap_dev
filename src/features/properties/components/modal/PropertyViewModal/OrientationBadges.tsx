"use client";

export default function OrientationBadges({
  rows,
}: {
  rows: { no: number; dir: string }[];
}) {
  if (!rows?.length) return <div className="text-sm text-slate-500">-</div>;
  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((r) => (
        <span
          key={r.no}
          className="inline-flex items-center h-8 rounded-md border px-3 text-sm bg-white"
        >
          {r.no}호 · {r.dir}
        </span>
      ))}
    </div>
  );
}
