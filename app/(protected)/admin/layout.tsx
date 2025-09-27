"use client";

import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
