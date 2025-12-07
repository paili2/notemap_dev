import { Button } from "@/components/atoms/Button/Button";

interface FilterActionsProps {
  onReset: () => void;
  onApply: () => void;
}

export const FilterActions = ({ onReset, onApply }: FilterActionsProps) => (
  <div className="border-t border-gray-200 p-3 mt-8 bg-white">
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={onReset}
        className="flex-1 bg-white text-gray-700 border-gray-300 text-xs h-8"
      >
        전체 초기화
      </Button>
      <Button
        onClick={onApply}
        className="flex-1 bg-blue-600 text-white text-xs h-8"
      >
        필터 적용 검색하기
      </Button>
    </div>
  </div>
);
