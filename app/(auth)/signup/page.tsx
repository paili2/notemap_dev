"use client";

import * as React from "react";
import Link from "next/link";
import { AuthPageLayout } from "@/components/layouts/AuthPageLayout/AuthPageLayout";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Label } from "@/components/atoms/Label/Label";

export default function SignUpPage() {
  return (
    <AuthPageLayout
      title="회원가입"
      subtitle="몇 가지만 입력하면 바로 시작할 수 있어요."
      sideImageUrl="https://placehold.co/1200x1600?text=Welcome"
      logo={<div className="text-xl font-bold">Notemap</div>}
      footer={
        <span className="text-muted-foreground">
          이미 계정이 있나요?{" "}
          <Link href="/signin" className="underline underline-offset-4">
            로그인
          </Link>
        </span>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input id="name" placeholder="홍길동" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" type="password" placeholder="••••••••" />
      </div>

      <Button type="submit" className="w-full">
        회원가입
      </Button>
    </AuthPageLayout>
  );
}
