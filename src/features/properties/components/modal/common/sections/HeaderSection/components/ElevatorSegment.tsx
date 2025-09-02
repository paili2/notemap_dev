import { cn } from "@/lib/utils";

const ElevatorSegment = ({
  value,
  onChange,
}: {
  value: "O" | "X";
  onChange: (v: "O" | "X") => void;
}) => {
  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={() => onChange("O")}
        className={cn(
          "px-3 h-9 text-sm",
          value === "O" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
        )}
        title="엘리베이터 O"
      >
        O
      </button>
      <button
        type="button"
        onClick={() => onChange("X")}
        className={cn(
          "px-3 h-9 text-sm border-l",
          value === "X" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
        )}
        title="엘리베이터 X"
      >
        X
      </button>
    </div>
  );
};

export default ElevatorSegment;
