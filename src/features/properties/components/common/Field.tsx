// label + content 2단 레이아웃

"use client";

export default function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-3 text-[13px]">
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
