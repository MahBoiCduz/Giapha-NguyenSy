/**
 * Tree layout functions — GPĐV-inspired custom recursive layout.
 * applyCustomLayout() runs exactly ONE layout pass and returns
 * BOTH positioned nodes AND routed edges from the same layout result.
 */

import type { TreeDirection, TreeMode } from "./types";
import type { LayoutConfig } from "./layout-types";
import { computeExpandLayout } from "./layout-engine";
import { computeSimpleLayout } from "./layout-simple";
import { computeGroupLayout } from "./layout-group";
import { buildTree, sortChildrenByMother } from "./build-tree";
import { DEFAULT_LAYOUT_CONFIG } from "./layout-constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEdge = any;

const NODE_WIDTH = 200;
const NODE_HEIGHT = 140;

interface LayoutOutput {
  nodes: AnyNode[];
  edges: AnyEdge[];
}

/**
 * Run custom layout ONCE and return both positioned nodes and routed edges.
 * Node positions and edge polyline routes come from the same layout result.
 */
export function applyCustomLayout(
  nodes: AnyNode[],
  edges: AnyEdge[],
  direction: TreeDirection = "down",
  treeMode: TreeMode = "expand"
): LayoutOutput {
  if (nodes.length === 0) return { nodes: [], edges };

  // Build adjacency maps from edges
  const childrenMap = new Map<string, string[]>();
  const spouseMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();
  const childMarriageMap = new Map<string, Map<string, string | null>>();

  for (const edge of edges) {
    if (edge.type === "parentChild") {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
      if (!parentMap.has(edge.target)) {
        parentMap.set(edge.target, []);
      }
      parentMap.get(edge.target)!.push(edge.source);

      // Track marriage for child grouping
      if (!childMarriageMap.has(edge.source)) {
        childMarriageMap.set(edge.source, new Map());
      }
      childMarriageMap.get(edge.source)!.set(
        edge.target,
        edge.data?.marriageId ?? null
      );
    }
    if (edge.type === "spouse") {
      if (!spouseMap.has(edge.source)) {
        spouseMap.set(edge.source, []);
      }
      spouseMap.get(edge.source)!.push(edge.target);
      if (!spouseMap.has(edge.target)) {
        spouseMap.set(edge.target, []);
      }
      spouseMap.get(edge.target)!.push(edge.source);
    }
  }

  // Build treeMap from React Flow nodes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treeMap = new Map<string, any>();

  for (const node of nodes) {
    const data = node.data;
    const isRoot = data.isRoot === true;

    treeMap.set(node.id, {
      memberId: node.id,
      fullName: data.fullName || "",
      gender: data.gender || "male",
      isDeceased: !data.isLiving,
      generation: data.generation || 1,
      birthOrder: data.birthOrder ?? null,
      width: isRoot ? NODE_WIDTH * DEFAULT_LAYOUT_CONFIG.rootScale : NODE_WIDTH,
      height: isRoot ? NODE_HEIGHT * DEFAULT_LAYOUT_CONFIG.rootScale : NODE_HEIGHT,
      x: 0,
      y: 0,
      spouseIds: spouseMap.get(node.id) || [],
      childIds: childrenMap.get(node.id) || [],
      parentIds: parentMap.get(node.id) || [],
      subtreeLeft: 0,
      subtreeRight: 0,
      positioned: false,
      childMarriageMap: childMarriageMap.get(node.id) || new Map(),
    });
  }

  // Determine root
  let rootId: string | null = null;
  for (const node of nodes) {
    if (node.data.isRoot) {
      rootId = node.id;
      break;
    }
  }
  if (!rootId && nodes.length > 0) {
    rootId = nodes[0].id;
  }
  if (!rootId) return { nodes, edges };

  // Sort children by mother
  for (const [, tnode] of treeMap) {
    tnode.childIds = sortChildrenByMother(tnode, treeMap);
  }

  // Pick layout strategy and run ONCE
  const config = { ...DEFAULT_LAYOUT_CONFIG, direction };
  let layoutResult;

  switch (treeMode) {
    case "simple":
      layoutResult = computeSimpleLayout(rootId, treeMap, config);
      break;
    case "group":
      layoutResult = computeGroupLayout(rootId, treeMap, config);
      break;
    case "expand":
    default:
      layoutResult = computeExpandLayout(rootId, treeMap, config);
      break;
  }

  // Apply positions back to nodes
  const positionedNodes = nodes.map((node: AnyNode) => {
    const position = layoutResult.positions.get(node.id);
    if (!position) return node;

    return {
      ...node,
      position: { x: position.x, y: position.y },
      data: {
        ...node.data,
        cardWidth: position.width,
        cardHeight: position.height,
      },
    };
  });

  // Apply edge routes from the layout result
  const routedEdges = edges.map((edge: AnyEdge) => {
    let route = null;

    if (edge.type === "parentChild") {
      const key = `${edge.source}->${edge.target}`;
      route = layoutResult.edgeRoutes.parentChild.get(key) || null;
    } else if (edge.type === "spouse") {
      route =
        layoutResult.edgeRoutes.spouse.get(
          `${edge.source}->${edge.target}`
        ) ||
        layoutResult.edgeRoutes.spouse.get(
          `${edge.target}->${edge.source}`
        ) ||
        null;
    }

    return {
      ...edge,
      data: {
        ...edge.data,
        route,
      },
    };
  });

  return { nodes: positionedNodes, edges: routedEdges };
}

/**
 * Filter nodes to only show a subset of generations from a given root.
 * BFS from root, tracking generation distance.
 */
export function filterByGenerations(
  nodes: AnyNode[],
  edges: AnyEdge[],
  rootId: string,
  maxGenerations: number
): { nodes: AnyNode[]; edges: AnyEdge[] } {
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
