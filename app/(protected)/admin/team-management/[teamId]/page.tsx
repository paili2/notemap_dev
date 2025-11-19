"use client";

import TeamDetailPage from "@/features/teams/components/TeamDetailPage";
import { AdminAuthGuard } from "@/components/auth-guard/AdminAuthGuard";

interface PageProps {
  params: {
    teamId: string;
  };
}

export default function Page({ params }: PageProps) {
  return (
    <AdminAuthGuard>
      <TeamDetailPage teamId={params.teamId} />
    </AdminAuthGuard>
  );
}
