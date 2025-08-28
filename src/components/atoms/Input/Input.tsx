import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"input"> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex items-center h-9 w-full rounded-md border border-input bg-transparent shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
          className
        )}
      >
        {leftIcon && (
          <span className="pl-2 text-gray-400 flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex-1 bg-transparent px-3 py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm",
            leftIcon ? "pl-2" : "",
            rightIcon ? "pr-2" : ""
          )}
          ref={ref}
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
