"use client";

import { useMemo } from "react";
import { applyCustomLayout, filterByGenerations } from "@/lib/tree/layout";
import type { TreeDirection, TreeMode } from "@/types/tree";

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
  treeMode?: TreeMode;
}

/**
 * Single-pass layout hook.
 * Filter → Layout (once) → return both positioned nodes and routed edges
 * from the SAME layout result. No double layout.
 */
export function useTreeLayout({
  nodes,
  edges,
  rootId,
  direction,
  maxGenerations,
  treeMode = "expand",
}: UseTreeLayoutProps) {
  return useMemo(() => {
    if (nodes.length === 0) return { nodes: [], edges: [] };

    // Step 1: Filter to max generations around the root
    let filteredNodes: AnyNode[];
    let filteredEdges: AnyEdge[];
    if (rootId) {
      const filtered = filterByGenerations(nodes, edges, rootId, maxGenerations);
      filteredNodes = filtered.nodes;
      filteredEdges = filtered.edges;
    } else {
      filteredNodes = nodes;
      filteredEdges = edges;
    }

    // Step 2: Run layout ONCE — returns both positioned nodes and routed edges
    return applyCustomLayout(filteredNodes, filteredEdges, direction, treeMode);
  }, [nodes, edges, rootId, direction, maxGenerations, treeMode]);
}
