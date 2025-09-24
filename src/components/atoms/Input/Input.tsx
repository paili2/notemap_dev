import * as React from "react";
import { cn } from "@/lib/cn";
type Props = React.ComponentProps<"input"> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** 안쪽 <input>에만 붙는 클래스 */
  inputClassName?: string;
};

const Input = React.forwardRef<HTMLInputElement, Props>(
  (
    { className, inputClassName, type = "text", leftIcon, rightIcon, ...props },
    ref
  ) => {
    return (
      <div
        className={cn(
          "flex items-center h-9 w-full rounded-md border border-input bg-transparent shadow-sm transition-colors",
          className
        )}
      >
        {leftIcon && (
          <span className="pl-2 text-gray-400 flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "flex-1 bg-transparent px-2 md:px-3 h-full text-sm leading-9 outline-none",
            "placeholder:text-muted-foreground",
            leftIcon && "pl-2",
            rightIcon && "pr-2",
            type === "number" &&
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            inputClassName
          )}
          {...props}
        />
        {rightIcon && (
          <span className="pr-2 text-gray-400 flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
