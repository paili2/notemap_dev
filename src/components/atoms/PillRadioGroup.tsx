const PillRadioGroup = <T extends string>({
  name,
  options,
  value,
  onChange,
  allowUnset = false,
}: {
  name: string;
  options: ReadonlyArray<T>;
  value?: T;
  onChange: (v: T | undefined) => void;
  /** 같은 항목을 다시 클릭하면 선택 해제할지 여부 */
  allowUnset?: boolean;
}) => {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="flex items-center gap-2"
    >
      {options.map((opt) => {
        const id = `${name}-${opt}`;
        const checked = value === opt;
        return (
          <label
            key={opt}
            htmlFor={id}
            className={[
              "inline-flex h-8 min-w-10 items-center justify-center rounded-lg px-1 md:px-3 text-sm whitespace-nowrap",
              "border transition-colors select-none cursor-pointer",
              checked
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <input
              id={id}
              type="radio"
              name={name}
              className="sr-only peer"
              checked={checked}
              onChange={() => {
                onChange(opt);
              }}
              onClick={(e) => {
                if (allowUnset && checked) {
                  e.preventDefault();
                  onChange(undefined);
                }
              }}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
};

export default PillRadioGroup;
