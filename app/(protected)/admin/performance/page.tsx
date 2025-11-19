"use client";

import { PerformancePage } from "@/features/admin/pages/PerformancePage";
import { AdminAuthGuard } from "@/components/auth-guard/AdminAuthGuard";

export default function Performance() {
  return (
    <AdminAuthGuard>
      <PerformancePage />
    </AdminAuthGuard>
  );
}

