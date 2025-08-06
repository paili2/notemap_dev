// 직원/고객 프로필
import React from "react";
import clsx from "clsx";

export interface AvatarProps {
  src?: string; // 아바타 이미지 경로
  alt?: string; // 이미지 설명
  size?: "small" | "medium" | "large"; // 크기
  rounded?: boolean; // 둥근 모양 여부
  status?: "online" | "offline" | "busy" | "away"; // 상태 표시
  name?: string; // 이미지 없을 경우 이니셜
  className?: string;
}

const Avatar = ({
  src,
  alt = "avatar",
  size = "medium",
  rounded = true,
  status,
  name,
  className,
}: AvatarProps) => {
  // 크기별 스타일
  const sizeClasses = {
    small: "w-8 h-8 text-sm",
    medium: "w-12 h-12 text-base",
    large: "w-16 h-16 text-lg",
  };

  // 상태 색상
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-yellow-400",
  };

  // 이니셜 (이미지가 없을 때)
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={clsx(
            "object-cover",
            sizeClasses[size],
            rounded ? "rounded-full" : "rounded-md",
            className
          )}
        />
      ) : (
        <div
          className={clsx(
            "flex items-center justify-center bg-gray-300 text-white font-medium",
            sizeClasses[size],
            rounded ? "rounded-full" : "rounded-md",
            className
          )}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
