import React from "react";

export interface IconBaseProps {
  size?: number;
  color?: string;
  className?: string;
}

export const IconBase = ({
  size = 24,
  color = "currentColor",
  className = "",
  children,
}: React.PropsWithChildren<IconBaseProps>) => {
  return React.cloneElement(children as React.ReactElement, {
    size,
    color,
    className,
  });
};
