import clsx from "clsx";
import { error } from "console";
import { Variable } from "lucide-react";
import { Span } from "next/dist/trace";
import React, { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: "small" | "medium" | "large";
  variant?: "default" | "outlined" | "filled" | "error";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const Input = ({
  inputSize = "medium",
  variant = "default",
  iconLeft,
  iconRight,
  ...props
}: InputProps) => {
  return (
    <div
      className={clsx(
        `w-full input-wrapper flex items-center gap-2 px-5 py-2 rounded-full bg-white ${inputSize} ${variant}`,
        {
          "border border-red-500": variant === "error",
        }
      )}
    >
      {iconLeft && <span className="icon-left">{iconLeft}</span>}
      <input
        {...props}
        className={clsx(
          "input-element outline-none w-full placeholder:text-sm",
          {
            "placeholder:text-red-500": variant === "error",
          }
        )}
      />
      {iconRight && <span className="icon-right">{iconRight}</span>}
    </div>
  );
};

export default Input;
