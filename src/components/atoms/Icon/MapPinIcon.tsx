// MapPinIcon, CalendarIcon 등
import React from "react";

interface MapPinIconProps {
  size?: number; // 아이콘 크기(px)
  color?: string; // 아이콘 색상
  className?: string; // 추가 클래스
}

const MapPinIcon = ({
  size = 24,
  color = "currentColor",
  className = "",
}: MapPinIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
};

export default MapPinIcon;
