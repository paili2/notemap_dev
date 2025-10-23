import dynamic from "next/dynamic";

const PinDetail = dynamic(
  () => import("@/features/pins/components/PinDetail"),
  { ssr: false }
);

export default function PinDetailPage({ params }: { params: { id: string } }) {
  return <PinDetail id={params.id} />;
}
