import { MemberForm } from "@/components/members/member-form";

export default async function NewMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ clanId: string }>;
  searchParams: Promise<{ spouseId?: string; parentId?: string }>;
}) {
  const { clanId } = await params;
  const { spouseId, parentId } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Thêm thành viên mới</h1>
      <MemberForm clanId={clanId} spouseId={spouseId} parentId={parentId} />
    </div>
  );
}
