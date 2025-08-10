"use client";

import * as React from "react";
import Link from "next/link";
import { AuthPageLayout } from "@/components/layouts/AuthPageLayout/AuthPageLayout";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { Label } from "@/components/atoms/Label/Label";

export default function SignInPage() {
  return (
    <AuthPageLayout
      title="로그인"
      subtitle="계정에 접속해 프로젝트를 시작하세요."
      sideImageUrl="https://placehold.co/1200x1600?text=Property"
      logo={<div className="text-xl font-bold">철판정 • Realty</div>}
      social={
        <>
          <Button variant="secondary">Google로 계속</Button>
          <Button variant="secondary">GitHub로 계속</Button>
        </>
      }
      footer={
        <span className="text-muted-foreground">
          계정이 없나요?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            회원가입
          </Link>
        </span>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" placeholder="you@example.com" type="email" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" type="password" placeholder="••••••••" />
      </div>

      <Button type="submit" className="w-full">
        로그인
      </Button>
    </AuthPageLayout>
  );
}
