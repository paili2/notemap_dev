"use client";

import { AdminPageHeader } from "./AdminPageHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
