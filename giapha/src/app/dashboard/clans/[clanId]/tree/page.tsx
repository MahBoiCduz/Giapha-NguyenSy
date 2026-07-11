"use client";

import { use } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FamilyTree } from "@/components/tree/family-tree";
import { useTreeData } from "@/components/tree/hooks/use-tree-data";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";

export default function TreePage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  const { clanId } = use(params);

  const { data, loading, error, refetch } = useTreeData({
    clanId,
    generations: 5,
    direction: "down",
  });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return <ErrorState message="Không có dữ liệu" onRetry={refetch} />;
  if (data.members.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Chưa có thành viên nào</h2>
          <p className="text-muted-foreground">
            Thêm thành viên đầu tiên để bắt đầu xây dựng phả đồ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <ReactFlowProvider>
        <FamilyTree treeData={data} clanId={clanId} />
      </ReactFlowProvider>
    </div>
  );
}
