import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 border-transparent",
        secondary: "bg-gray-200 text-gray-800 border-transparent",
        destructive: "bg-red-100 text-red-800 border-transparent",
        success: "bg-green-100 text-green-800 border-transparent",
        warning: "bg-yellow-100 text-yellow-800 border-transparent",
        info: "bg-blue-100 text-blue-800 border-transparent",
        outline: "bg-transparent text-gray-800 border-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
