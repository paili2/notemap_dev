"use client";

import { Button } from "@/components/atoms/Button/Button";
import { ContextMenuItemProps } from "./types";

export default function ContextMenuItem({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: ContextMenuItemProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-start px-2.5 py-2 text-left text-[12px] hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="truncate">{label}</span>
    </Button>
  );
}
