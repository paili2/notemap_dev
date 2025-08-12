import * as React from "react";
import { AuthPageLayout } from "@/features/auth/layouts/AuthPageLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function SignInPage() {
  return (
    <AuthPageLayout
      leftWidthPx={720}
      className="lg:[grid-template-columns:var(--left-col)_minmax(560px,1fr)]"
      title="로그인"
      subtitle="계정에 로그인하고 매물 관리를 시작하세요."
      logo={<div className="text-xl font-bold">NoteMap</div>}
      sideImageUrl="https://placehold.co/1200x1600?text=Brand"
    >
      <LoginForm />
    </AuthPageLayout>
  );
}
