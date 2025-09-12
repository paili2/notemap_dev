import { LucideIcon } from "lucide-react";

export type ContextMenuItemProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
};

export type ContextMenuPanelProps = {
  roadAddress?: string | null;
  jibunAddress?: string | null;
  /** "__draft__" or 실제 id */
  propertyId?: "__draft__" | string | null;
  /** 매물명 (선택) */
  propertyTitle?: string | null;
  onClose: () => void;
  onView: (id: string) => void;
  onCreate: () => void;
};
