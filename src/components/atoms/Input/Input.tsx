import clsx from "clsx";
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
        className={"input-element outline-none w-full placeholder:text-sm"}
      />
      {iconRight && <span className="icon-right">{iconRight}</span>}
    </div>
  );
};

export default Input;
