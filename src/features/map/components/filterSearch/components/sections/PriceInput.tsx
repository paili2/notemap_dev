import { Input } from "@/components/atoms/Input/Input";
import {
  formatKoreanCurrency,
  formatNumberWithCommas,
} from "../../utils/formatters";

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  showKoreanCurrency?: boolean;
}

export const PriceInput = ({
  value,
  onChange,
  placeholder,
  className = "",
  showKoreanCurrency = true,
}: PriceInputProps) => (
  <div className="w-full">
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(formatNumberWithCommas(e.target.value))}
      className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 text-xs h-8 w-full ${className}`}
    />
    {showKoreanCurrency && (
      <p className="text-xs text-gray-700 mt-1 truncate">
        {value && value !== "0" ? formatKoreanCurrency(value) : "0원"}
      </p>
    )}
  </div>
);
