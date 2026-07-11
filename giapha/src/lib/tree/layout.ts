import { graphlib, layout } from "@dagrejs/dagre";
import type { TreeDirection } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEdge = any;

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;
const RANK_SEP = 150;
const NODE_SEP = 80;

/**
 * Apply Dagre layout to nodes and edges.
 * Returns new nodes with calculated positions.
 */
export function applyDagreLayout(
  nodes: AnyNode[],
  edges: AnyEdge[],
  direction: TreeDirection = "down"
): AnyNode[] {
  const g = new graphlib.Graph({ multigraph: true });
  g.setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: direction === "down" ? "TB" : "BT",
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
    edgesep: 40,
    marginx: 40,
    marginy: 40,
  });

  // Add nodes
  for (const node of nodes) {
    g.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  }

  // Add edges (only parent-child for layout — spouse edges are horizontal)
  for (const edge of edges) {
    if (edge.type === "parentChild") {
      g.setEdge(
        { v: edge.source, w: edge.target },
        { weight: 1, minlen: 1 }
      );
    }
    if (edge.type === "spouse") {
      g.setEdge(
        { v: edge.source, w: edge.target },
        { weight: 0.1, minlen: 2 }
      );
    }
  }

  // Run the layout
  layout(g);

  // Update node positions
  return nodes.map((node: AnyNode) => {
    const nodeWithPosition = g.node(node.id);
    if (!nodeWithPosition) return node;

    const x = nodeWithPosition.x - NODE_WIDTH / 2;
    const y = nodeWithPosition.y - NODE_HEIGHT / 2;

    return {
      ...node,
      position: { x, y },
    };
  });
}

/**
 * Filter nodes to only show a subset of generations from a given root.
 */
export function filterByGenerations(
  nodes: AnyNode[],
  edges: AnyEdge[],
  rootId: string,
  maxGenerations: number
): { nodes: AnyNode[]; edges: AnyEdge[] } {
  // BFS from root, tracking generation distance
  const visited = new Map<string, number>();
  const queue: string[] = [rootId];
  visited.set(rootId, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = visited.get(current)!;

    if (currentDist >= maxGenerations) continue;

    const relatedEdges = edges.filter(
      (e: AnyEdge) =>
        (e.source === current && e.type === "parentChild") ||
        (e.target === current && e.type === "parentChild")
    );

    for (const edge of relatedEdges) {
      const neighbor =
        edge.source === current ? edge.target : edge.source;
      if (!visited.has(neighbor)) {
        visited.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    }
  }

  // Include spouses of visited nodes
  const visitedIds = new Set(visited.keys());
  for (const edge of edges) {
    if (edge.type === "spouse") {
      if (visitedIds.has(edge.source) && !visitedIds.has(edge.target)) {
        visitedIds.add(edge.target);
      }
      if (visitedIds.has(edge.target) && !visitedIds.has(edge.source)) {
        visitedIds.add(edge.source);
      }
    }
  }

  const filteredNodes = nodes.filter((n: AnyNode) => visitedIds.has(n.id));
  const filteredEdges = edges.filter(
    (e: AnyEdge) => visitedIds.has(e.source) && visitedIds.has(e.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}
