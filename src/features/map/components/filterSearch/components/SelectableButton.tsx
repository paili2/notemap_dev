import { Button } from "@/components/atoms/Button/Button";
import { SelectableButtonProps } from "../types/filterSearch.types";

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
        ? "bg-blue-600 text-white hover:bg-blue-500 border-blue-600 hover:border-blue-500"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`}
    onClick={onClick}
  >
    {label}
  </Button>
);
