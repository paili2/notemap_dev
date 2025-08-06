import React, { InputHTMLAttributes } from "react";
import clsx from "clsx";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: string;
  size?: "small" | "medium" | "large";
}

const Checkbox = ({
  label,
  size = "medium",
  disabled = false,
  className,
  ...props
}: CheckboxProps) => {
  return (
    <label
      className={clsx(
        "flex items-center cursor-pointer select-none gap-2",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        type="checkbox"
        disabled={disabled}
        className={clsx(
          "accent-blue-500 cursor-pointer",
          {
            "w-4 h-4": size === "small",
            "w-5 h-5": size === "medium",
            "w-6 h-6": size === "large",
          },
          className
        )}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};

export default Checkbox;
