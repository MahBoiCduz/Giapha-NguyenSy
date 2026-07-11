"use client";

import { useState, useEffect, useCallback } from "react";
import type { TreeData } from "@/types/tree";

interface UseTreeDataProps {
  clanId: string;
  rootId?: string;
  generations?: number;
  direction?: "up" | "down";
}

export function useTreeData({
  clanId,
  rootId,
  generations = 5,
  direction = "down",
}: UseTreeDataProps) {
  const [data, setData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (rootId) params.set("rootId", rootId);
      params.set("generations", generations.toString());
      params.set("direction", direction);

      const res = await fetch(
        `/api/clans/${clanId}/tree?${params.toString()}`
      );

      if (!res.ok) throw new Error("Không thể tải dữ liệu phả đồ");

      const treeData: TreeData = await res.json();
      setData(treeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, [clanId, rootId, generations, direction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
