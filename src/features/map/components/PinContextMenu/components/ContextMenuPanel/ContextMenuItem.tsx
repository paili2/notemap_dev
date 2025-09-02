"use client";

import { Button } from "@/components/atoms/Button/Button";
import { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

export default function ContextMenuItem({ label, icon: Icon, onClick }: Props) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="w-full justify-start px-2.5 py-2 text-left text-[12px] hover:bg-black/5"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center">
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate">{label}</span>
    </Button>
  );
}
