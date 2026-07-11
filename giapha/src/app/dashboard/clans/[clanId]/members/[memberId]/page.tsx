export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ clanId: string; memberId: string }>;
}) {
  const { clanId, memberId } = await params;

  return (
    <div>
      <p className="text-muted-foreground mb-4">Đang tải thông tin thành viên...</p>
      <p>clanId: {clanId}, memberId: {memberId}</p>
    </div>
  );
}
