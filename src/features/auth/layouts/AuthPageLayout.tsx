"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/atoms/Card/Card";
import { AuthPageLayoutProps } from "./AuthPageLayout.type";
import Image from "next/image";

type Vars = CSSProperties & { ["--left-col"]?: string };

export function AuthPageLayout({
  sideImageUrl,
  sideOverlay,
  leftWidthPx = 560,

  title,
  subtitle,
  social,
  footer,

  children,
  className,
  rightClassName,
  cardClassName,
  frame = "card",
}: AuthPageLayoutProps) {
  const style: Vars = { "--left-col": `${leftWidthPx}px` };

  return (
    <div
      style={style}
      className={cn(
        "h-[100dvh] w-full overflow-hidden bg-background",
        className
      )}
    >
      <div
        className={cn(
          "flex h-full items-center justify-center px-6 py-8 overflow-y-auto",
          rightClassName
        )}
      >
        <div className={cn("w-full max-w-lg", cardClassName)}>
          {frame === "card" ? (
            <Card className="rounded-2xl shadow-xl px-3">
              {/* ✅ 카드 내부 상단에 로고 배치 */}
              <CardHeader className="space-y-3 py-6">
                <div className="mx-auto relative h-10 w-40">
                  <Image
                    src="/mainlogo.webp"
                    alt="메인 로고"
                    fill
                    sizes="160px"
                    className="object-contain"
                    priority
                  />
                </div>

                {(title || subtitle) && (
                  <div className="space-y-2 text-center">
                    {title && (
                      <CardTitle className="text-3xl font-extrabold">
                        {title}
                      </CardTitle>
                    )}
                    {subtitle && (
                      <p className="text-base text-muted-foreground">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {social && (
                  <>
                    <div className="grid gap-2">{social}</div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          또는 이메일로 계속하기
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-4">{children}</div>

                {footer && (
                  <div className="pt-2 text-center text-sm text-muted-foreground">
                    {footer}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // frame="none" → 카드 없이 바로 children만
            <div className="w-full">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
