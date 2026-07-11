import { redirect } from "next/navigation";

export default async function ClanPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = await params;
  redirect(`/dashboard/clans/${clanId}/tree`);
}
