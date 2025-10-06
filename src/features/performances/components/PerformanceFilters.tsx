import { Button } from "@/components/atoms/Button/Button";
import { Label } from "@/components/atoms/Label/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/Select";

interface PerformanceFiltersProps {
  selectedPeriod: string;
  selectedYear: string;
  yearOptions: string[];
  onPeriodChange: (period: string) => void;
  onYearChange: (year: string) => void;
  onClose: () => void;
}

export function PerformanceFilters({
  selectedPeriod,
  selectedYear,
  yearOptions,
  onPeriodChange,
  onYearChange,
  onClose,
}: PerformanceFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm">기간:</Label>
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">이번 달</SelectItem>
            <SelectItem value="year">올해</SelectItem>
            <SelectItem value="yearly">연도 선택</SelectItem>
          </SelectContent>
        </Select>
        {selectedPeriod === "yearly" && (
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Button variant="outline" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}
