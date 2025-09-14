import { Button } from "@/components/atoms/Button/Button";
import { SelectableButtonProps } from "../types/types";

export const SelectableButton = ({
  label,
  isSelected,
  onClick,
}: SelectableButtonProps) => (
  <Button
    variant={isSelected ? "default" : "outline"}
    size="sm"
    className={`text-xs border px-2 py-1 h-7 ${
      isSelected
        ? "bg-gray-900 text-white hover:bg-gray-800 border-gray-900"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`}
    onClick={onClick}
  >
    {label}
  </Button>
);
