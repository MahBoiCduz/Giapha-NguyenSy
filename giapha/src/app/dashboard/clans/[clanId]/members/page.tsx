"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MemberCard } from "@/components/members/member-card";
import { MemberSearch } from "@/components/members/member-search";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { Plus } from "lucide-react";
import type { Member } from "@/types/member";

export default function MembersPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (search?: string) => {
    try {
      setError(null);
      const url = new URL(`/api/clans/${clanId}/members`, window.location.origin);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Không thể tải danh sách thành viên");
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }, [clanId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearch = (query: string) => {
    fetchMembers(query);
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => fetchMembers()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh sách thành viên</h1>
        <Link href={`/dashboard/clans/${clanId}/members/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Thêm thành viên
          </Button>
        </Link>
      </div>

      <MemberSearch onSearch={handleSearch} />

      {members.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Chưa có thành viên nào</h2>
          <p className="text-muted-foreground mb-4">
            Thêm thành viên đầu tiên để bắt đầu xây dựng phả đồ
          </p>
          <Link href={`/dashboard/clans/${clanId}/members/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Thêm thành viên
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} clanId={clanId} />
          ))}
        </div>
      )}
    </div>
  );
}
