import { Button } from "@/components/atoms/Button/Button";
import { cn } from "@/lib/cn";

const ElevatorSegment = ({
  value,
  onChange,
}: {
  value: "O" | "X";
  onChange: (v: "O" | "X") => void;
}) => {
  return (
    <div className="inline-flex rounded-md overflow-hidden">
      <Button
        type="button"
        onClick={() => onChange("O")}
        variant="outline"
        size="default"
        className={cn(
          "px-3 h-9 text-sm rounded-r-none",
          value === "O"
            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
            : "bg-white text-gray-700 hover:bg-transparent"
        )}
        title="엘리베이터 O"
      >
        O
      </Button>
      <Button
        type="button"
        onClick={() => onChange("X")}
        variant="outline"
        size="default"
        className={cn(
          "px-3 h-9 text-sm border-l rounded-l-none",
          value === "X"
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
