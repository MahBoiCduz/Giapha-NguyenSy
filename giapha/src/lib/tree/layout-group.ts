/**
 * GroupTree layout mode.
 * Members are grouped by generation level.
 *
 * UpToDown: Each generation is a horizontal row.
 * LeftToRight: Each generation is a vertical column.
 *
 * Inspired by GPĐV's GroupCoordinateBuilder.
 */

import type {
  TreeNode,
  MemberId,
  LayoutConfig,
  LayoutResult,
  PositionInfo,
  EdgeRouteMap,
  EdgeRoute,
} from "./layout-types";
import { DEFAULT_LAYOUT_CONFIG } from "./layout-constants";

export function computeGroupLayout(
  rootId: MemberId,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): LayoutResult {
  if (treeMap.size === 0) {
    return {
      positions: new Map(),
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      edgeRoutes: { parentChild: new Map(), spouse: new Map() },
    };
  }

  // Group members by generation
  const generations = new Map<number, MemberId[]>();
  for (const [id, node] of treeMap) {
    const gen = node.generation;
    if (!generations.has(gen)) generations.set(gen, []);
    generations.get(gen)!.push(id);
  }

  // Sort generation levels
  const sortedGens = [...generations.keys()].sort((a, b) => a - b);

  // Sort members within each generation by birth order, then name
  for (const [, members] of generations) {
    members.sort((a, b) => {
      const na = treeMap.get(a)!;
      const nb = treeMap.get(b)!;
      return (na.birthOrder ?? 999) - (nb.birthOrder ?? 999);
    });
  }

  // Layout: top-down generation rows
  let currentY = 0;
  let maxWidth = 0;

  for (const gen of sortedGens) {
    const genMembers = generations.get(gen)!;
    let currentX = 0;

    for (const memberId of genMembers) {
      const node = treeMap.get(memberId)!;
      node.x = currentX;
      node.y = currentY;
      node.positioned = true;

      currentX += node.width + config.horizontalSpacing;
    }

    // Position spouses horizontally next to each member
    for (const memberId of genMembers) {
      const node = treeMap.get(memberId)!;
      let spouseX = node.x + node.width + config.spouseGap;

      for (const spouseId of node.spouseIds) {
        const spouse = treeMap.get(spouseId);
        if (!spouse || spouse.positioned) continue;
        spouse.x = spouseX;
        spouse.y = currentY;
        spouse.positioned = true;
        spouseX = spouse.x + spouse.width + config.spouseGap;
      }
    }

    if (currentX > maxWidth) maxWidth = currentX;
    currentY +=
      config.cardHeight +
      config.verticalSpacing;
  }

  // Compute bounds
  let maxY = 0;
  for (const [, node] of treeMap) {
    if (!node.positioned) continue;
    const b = node.y + node.height;
    if (b > maxY) maxY = b;
  }

  const bounds = { minX: 0, minY: 0, maxX: maxWidth, maxY };
  const positions = extractPositions(treeMap);
  const edgeRoutes = computeGroupEdgeRoutes(treeMap);

  return { positions, bounds, edgeRoutes };
}

function extractPositions(
  treeMap: Map<MemberId, TreeNode>
): Map<MemberId, PositionInfo> {
  const positions = new Map<MemberId, PositionInfo>();
  for (const [id, node] of treeMap) {
    if (!node.positioned) continue;
    positions.set(id, {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    });
  }
  return positions;
}

function computeGroupEdgeRoutes(
  treeMap: Map<MemberId, TreeNode>
): EdgeRouteMap {
  const parentChild = new Map<string, EdgeRoute>();
  const spouse = new Map<string, EdgeRoute>();

  for (const [, node] of treeMap) {
    if (!node.positioned) continue;

    // Spouse edges
    for (const spouseId of node.spouseIds) {
      if (node.memberId >= spouseId) continue;
      const sp = treeMap.get(spouseId);
      if (!sp || !sp.positioned) continue;
      const y = (node.y + node.height / 2 + sp.y + sp.height / 2) / 2;
      spouse.set(`${node.memberId}->${spouseId}`, {
        points: [
          { x: node.x + node.width, y },
          { x: sp.x, y },
        ],
      });
    }

    // Parent-child edges (simple vertical)
    for (const childId of node.childIds) {
      const child = treeMap.get(childId);
      if (!child || !child.positioned) continue;
      const key = `${node.memberId}->${childId}`;
      const midY = (node.y + node.height + child.y) / 2;
      parentChild.set(key, {
        points: [
          { x: node.x + node.width / 2, y: node.y + node.height },
          { x: node.x + node.width / 2, y: midY },
          { x: child.x + child.width / 2, y: midY },
          { x: child.x + child.width / 2, y: child.y },
        ],
      });
    }

    // Route spouse → shared children (dual-parent edge convergence)
    for (const spouseId of node.spouseIds) {
      const spouseNode = treeMap.get(spouseId);
      if (!spouseNode || !spouseNode.positioned) continue;

      for (const childId of spouseNode.childIds) {
        const child = treeMap.get(childId);
        if (!child || !child.positioned) continue;
        const key = `${spouseId}->${childId}`;
        if (!parentChild.has(key)) {
          const midY = (spouseNode.y + spouseNode.height + child.y) / 2;
          parentChild.set(key, {
            points: [
              { x: spouseNode.x + spouseNode.width / 2, y: spouseNode.y + spouseNode.height },
              { x: spouseNode.x + spouseNode.width / 2, y: midY },
              { x: child.x + child.width / 2, y: midY },
              { x: child.x + child.width / 2, y: child.y },
            ],
          });
        }
      }
    }
  }

  return { parentChild, spouse };
}
