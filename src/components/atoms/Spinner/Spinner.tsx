// 로딩상태
import React from "react";
import clsx from "clsx";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "white" | "gray";
  thickness?: "thin" | "normal" | "thick";
}

const Spinner = ({
  size = "medium",
  color = "primary",
  thickness = "normal",
}: SpinnerProps) => {
  return (
    <div
      className={clsx("animate-spin rounded-full border-t-transparent", {
        // 크기
        "w-4 h-4": size === "small",
        "w-6 h-6": size === "medium",
        "w-8 h-8": size === "large",
        // 색상
        "border-blue-500": color === "primary",
        "border-gray-400": color === "secondary",
        "border-white": color === "white",
        "border-gray-200": color === "gray",
        // 두께
        "border-2": thickness === "thin",
        "border-4": thickness === "normal",
        "border-[6px]": thickness === "thick",
      })}
    />
  );
};

export default Spinner;
