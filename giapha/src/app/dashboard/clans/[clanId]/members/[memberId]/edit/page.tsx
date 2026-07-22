"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { MemberForm } from "@/components/members/member-form";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import type { Member } from "@/types/member";

export default function EditMemberPage({
  params,
}: {
  params: Promise<{ clanId: string; memberId: string }>;
}) {
  const { clanId, memberId } = use(params);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clans/${clanId}/members/${memberId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải thông tin thành viên");
        return res.json();
      })
      .then((data) => setMember(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Đã xảy ra lỗi"))
      .finally(() => setLoading(false));
  }, [clanId, memberId]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!member) return <ErrorState message="Không tìm thấy thành viên" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sửa {member.fullName}</h1>
      <MemberForm clanId={clanId} member={member} />
    </div>
  );
}
