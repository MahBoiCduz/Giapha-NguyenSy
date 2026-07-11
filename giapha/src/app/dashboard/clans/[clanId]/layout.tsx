import { ClanNav } from "@/components/layout/clan-nav";

export default async function ClanLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = await params;

  return (
    <div className="flex-1 flex flex-col">
      <ClanNav clanId={clanId} />
      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}
