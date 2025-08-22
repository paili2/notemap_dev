// features/properties/components/modal/PropertyEditModal/components/NumberSelector.tsx
import { Input } from "@/components/atoms/Input/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";

export default function NumberSelector({
  items,
  type,
  setType,
  value,
  setValue,
}: {
  items: string[];
  type: "select" | "custom";
  setType: (t: "select" | "custom") => void;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <Select
        value={type === "select" ? value : "custom"}
        onValueChange={(val) => {
          if (val === "custom") {
            setType("custom");
            setValue("");
          } else {
            setType("select");
            setValue(val);
          }
        }}
      >
        <SelectTrigger className="w-24 h-9">
          <SelectValue placeholder="선택" />
        </SelectTrigger>
        <SelectContent className="max-h-64 overflow-auto">
          {items.map((n) => (
            <SelectItem key={n} value={n}>
              {n}
            </SelectItem>
          ))}
          <SelectItem value="custom">직접입력</SelectItem>
        </SelectContent>
      </Select>

      {type === "custom" && (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="예: 2"
          className="w-20 h-9 text-center"
          inputMode="numeric"
        />
      )}
    </div>
  );
}
