"use client";

import { MyPageHeader } from "@/features/my-page/components/MyPageHeader";

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MyPageHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}

