import { Button } from "@/components/atoms/Button/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_TEAMS } from "../_mock";
import UserSettingsPage from "@/features/users/pages/UserSettingsPage";

interface TeamDetailPageProps {
  teamId: string;
}

export default function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const team = MOCK_TEAMS.find((t) => t.id === teamId);

  if (!team) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <div className="px-6 flex-col items-center">
        <Link href="/admin/team-management">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />팀 목록으로
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight pt-4">
            {team.name} 관리
          </h1>
          <p className="text-sm text-muted-foreground pt-2">
            {team.name} 팀원 계정을 조회하고 관리합니다.
          </p>
        </div>
      </div>

      <div className="p-1 pb-8">
        <UserSettingsPage />
      </div>
    </div>
  );
}
