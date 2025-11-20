"use client";

import TeamManagementPage from "@/features/teams/components/TeamManagementPage";
import { AdminAuthGuard } from "@/components/auth-guard/AdminAuthGuard";

export default function Page() {
  return (
    <AdminAuthGuard>
      <TeamManagementPage />
    </AdminAuthGuard>
  );
}
