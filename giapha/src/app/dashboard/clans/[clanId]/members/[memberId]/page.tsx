"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { MemberProfile } from "@/components/members/member-profile";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import type { MemberWithRelations } from "@/types/member";

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ clanId: string; memberId: string }>;
}) {
  const { clanId, memberId } = use(params);
  const [member, setMember] = useState<MemberWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/clans/${clanId}/members/${memberId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Không tìm thấy thành viên");
        throw new Error("Không thể tải thông tin thành viên");
      }
      const data = await res.json();
      setMember(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [clanId, memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchMember} />;
  if (!member) return <ErrorState message="Không tìm thấy thành viên" onRetry={fetchMember} />;

  return <MemberProfile member={member} clanId={clanId} onRefresh={fetchMember} />;
}
