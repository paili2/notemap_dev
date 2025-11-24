import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/cn";

type ElevatorValue = "O" | "X" | null;

const ElevatorSegment = ({
  value,
  onChange,
}: {
  value: ElevatorValue; // ⬅ "O" | "X" | null 허용
  onChange: (v: ElevatorValue) => void;
}) => {
  const isO = value === "O";
  const isX = value === "X";

  return (
    <div className="inline-flex rounded-md overflow-hidden">
      <Button
        type="button"
        onClick={() => onChange(isO ? null : "O")} // ⬅ 이미 O면 다시 눌러서 해제도 가능
        variant="outline"
        size="default"
        className={cn(
          "px-3 h-9 text-sm rounded-r-none",
          isO
            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
            : "bg-white text-gray-700 hover:bg-transparent"
        )}
        title="엘리베이터 O"
      >
        O
      </Button>
      <Button
        type="button"
        onClick={() => onChange(isX ? null : "X")}
        variant="outline"
        size="default"
        className={cn(
          "px-3 h-9 text-sm border-l rounded-l-none",
          isX
            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
            : "bg-white text-gray-700 hover:bg-transparent"
        )}
        title="엘리베이터 X"
      >
        X
      </Button>
    </div>
  );
};

export default ElevatorSegment;
