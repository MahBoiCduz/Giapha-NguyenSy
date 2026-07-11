import { MemberForm } from "@/components/members/member-form";

export default async function NewMemberPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = await params;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Thêm thành viên mới</h1>
      <MemberForm clanId={clanId} />
    </div>
  );
}
