import { Input } from "@/components/atoms/Input/Input";
import {
  convertPyeongToSquareMeter,
  formatNumberWithCommas,
} from "../../utils/formatters";

interface AreaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  /** 인풋 아래 ㎡ 표시 여부 (기본 true) */
  showConvertedM2?: boolean;
}

export const AreaInput = ({
  value,
  onChange,
  placeholder,
  className = "",
  showConvertedM2 = true, // 기본값: 예전처럼 표시
}: AreaInputProps) => {
  return (
    <div className="w-full">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(formatNumberWithCommas(e.target.value))}
          className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 text-xs h-8 w-full pr-8 ${className}`}
        />
        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
          평
        </span>
      </div>

      {/* ⬇️ 조건부 ㎡ 출력 */}
      {showConvertedM2 && (
        <p className="text-xs text-gray-700 mt-1 truncate">
          {value && value !== "0"
            ? `${convertPyeongToSquareMeter(value)}㎡`
            : "0㎡"}
        </p>
      )}
    </div>
  );
};
