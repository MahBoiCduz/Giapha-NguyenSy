"use client";

import { useMemo } from "react";
import { applyDagreLayout, filterByGenerations } from "@/lib/tree/layout";
import type { TreeDirection } from "@/types/tree";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEdge = any;

interface UseTreeLayoutProps {
  nodes: AnyNode[];
  edges: AnyEdge[];
  rootId: string | null;
  direction: TreeDirection;
  maxGenerations: number;
}

export function useTreeLayout({
  nodes,
  edges,
  rootId,
  direction,
  maxGenerations,
}: UseTreeLayoutProps) {
  const layoutedNodes = useMemo(() => {
    if (nodes.length === 0) return [];

    // Filter to max generations around the root
    let filtered: { nodes: AnyNode[]; edges: AnyEdge[] };
    if (rootId) {
      filtered = filterByGenerations(nodes, edges, rootId, maxGenerations);
    } else {
      filtered = { nodes, edges };
    }

    // Apply Dagre layout
    return applyDagreLayout(filtered.nodes, filtered.edges, direction);
  }, [nodes, edges, rootId, direction, maxGenerations]);

  const layoutedEdges = useMemo(() => {
    if (edges.length === 0) return [];

    if (rootId) {
      const filtered = filterByGenerations(nodes, edges, rootId, maxGenerations);
      return filtered.edges;
    }
    return edges;
  }, [nodes, edges, rootId, maxGenerations]);

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
