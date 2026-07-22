"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { ClanSettingsForm } from "@/components/clans/clan-settings-form";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import type { Clan } from "@/types/clan";

export default function ClanSettingsPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = use(params);
  const [clan, setClan] = useState<Clan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clans/${clanId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải thông tin dòng họ");
        return res.json();
      })
      .then((data) => setClan(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Đã xảy ra lỗi"))
      .finally(() => setLoading(false));
  }, [clanId]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!clan) return <ErrorState message="Không tìm thấy dòng họ" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cài đặt dòng họ</h1>
      <ClanSettingsForm clan={clan} />
    </div>
  );
}
