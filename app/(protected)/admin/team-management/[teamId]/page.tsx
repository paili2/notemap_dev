import TeamDetailPage from "@/features/teams/components/TeamDetailPage";

interface PageProps {
  params: {
    teamId: string;
  };
}

export default function Page({ params }: PageProps) {
  return <TeamDetailPage teamId={params.teamId} />;
}
