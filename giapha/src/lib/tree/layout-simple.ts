/**
 * SimpleTree layout mode.
 * Only the FIRST spouse is shown. No LeftMember positioning.
 * Children are sorted by birth order (not grouped by mother).
 *
 * Inspired by GPĐV's SimpleCoordinateBuilder.
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

export function computeSimpleLayout(
  rootId: MemberId,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): LayoutResult {
  const root = treeMap.get(rootId);
  if (!root) {
    return {
      positions: new Map(),
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      edgeRoutes: { parentChild: new Map(), spouse: new Map() },
    };
  }

  // Sort children by birth order only (simple sort, no mother grouping)
  sortAllChildrenSimple(rootId, treeMap);

  // Run recursive layout
  layoutSimple(rootId, treeMap, config, 0, 0);

  // Compute bounds & positions
  const bounds = computeBounds(treeMap);
  const positions = extractPositions(treeMap);
  const edgeRoutes = computeSimpleEdgeRoutes(rootId, treeMap);

  return { positions, bounds, edgeRoutes };
}

// ---- Simple child sort (birth order only, no mother grouping) ----

function sortAllChildrenSimple(
  memberId: MemberId,
  treeMap: Map<MemberId, TreeNode>
): void {
  const node = treeMap.get(memberId);
  if (!node) return;

  node.childIds.sort((a, b) => {
    const na = treeMap.get(a);
    const nb = treeMap.get(b);
    return (na?.birthOrder ?? 999) - (nb?.birthOrder ?? 999);
  });

  for (const childId of node.childIds) {
    sortAllChildrenSimple(childId, treeMap);
  }
}

// ---- Simple recursive layout ----

function layoutSimple(
  memberId: MemberId,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig,
  xOffset: number,
  yOffset: number
): void {
  const node = treeMap.get(memberId);
  if (!node || node.positioned) return;

  node.y = yOffset;

  const validChildren = node.childIds.filter((cid) =>
    treeMap.has(cid)
  );

  if (validChildren.length === 0) {
    // Leaf node
    node.x = xOffset;
    // Only first spouse
    const firstSpouse = node.spouseIds[0];
    if (firstSpouse && treeMap.has(firstSpouse)) {
      const spouse = treeMap.get(firstSpouse)!;
      spouse.y = node.y;
      spouse.x = node.x + node.width + config.spouseGap;
      spouse.positioned = true;
      node.subtreeRight =
        spouse.x + spouse.width + config.horizontalSpacing;
    } else {
      node.subtreeRight =
        node.x + node.width + config.horizontalSpacing;
    }
    node.subtreeLeft = node.x;
    node.positioned = true;
    return;
  }

  // Layout children
  const childrenY = yOffset + node.height + config.verticalSpacing;
  let currentX = xOffset;

  for (const childId of validChildren) {
    layoutSimple(childId, treeMap, config, currentX, childrenY);
    currentX = treeMap.get(childId)!.subtreeRight;
  }

  // Center between children
  const firstChild = treeMap.get(validChildren[0])!;
  const lastChild = treeMap.get(validChildren[validChildren.length - 1])!;
  node.x =
    (firstChild.x + lastChild.x + lastChild.width) / 2 -
    node.width / 2;
  if (node.x < xOffset) node.x = xOffset;

  // Only first spouse, positioned to the right
  const firstSpouse = node.spouseIds[0];
  if (firstSpouse && treeMap.has(firstSpouse)) {
    const spouse = treeMap.get(firstSpouse)!;
    spouse.y = node.y;
    spouse.x = node.x + node.width + config.spouseGap;
    spouse.positioned = true;

    node.subtreeLeft = Math.min(node.x, lastChild.subtreeLeft);
    node.subtreeRight = Math.max(
      spouse.x + spouse.width + config.horizontalSpacing,
      lastChild.subtreeRight
    );
  } else {
    node.subtreeLeft = Math.min(node.x, lastChild.subtreeLeft);
    node.subtreeRight = Math.max(
      node.x + node.width + config.horizontalSpacing,
      lastChild.subtreeRight
    );
  }

  node.positioned = true;
}

// ---- Bounds & positions ----

function computeBounds(treeMap: Map<MemberId, TreeNode>) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [, node] of treeMap) {
    if (!node.positioned) continue;
    if (node.x < minX) minX = node.x;
    if (node.y < minY) minY = node.y;
    const r = node.x + node.width;
    const b = node.y + node.height;
    if (r > maxX) maxX = r;
    if (b > maxY) maxY = b;
  }
  return {
    minX: minX === Infinity ? 0 : minX,
    minY: minY === Infinity ? 0 : minY,
    maxX: maxX === -Infinity ? 0 : maxX,
    maxY: maxY === -Infinity ? 0 : maxY,
  };
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

// ---- Simple edge routes ----

function computeSimpleEdgeRoutes(
  rootId: MemberId,
  treeMap: Map<MemberId, TreeNode>
): EdgeRouteMap {
  const parentChild = new Map<string, EdgeRoute>();
  const spouse = new Map<string, EdgeRoute>();

  function recurse(memberId: MemberId): void {
    const node = treeMap.get(memberId);
    if (!node) return;

    // Spouse edge (only first)
    const firstSpouse = node.spouseIds[0];
    if (firstSpouse && treeMap.has(firstSpouse) && memberId < firstSpouse) {
      const sp = treeMap.get(firstSpouse)!;
      const y = (node.y + node.height / 2 + sp.y + sp.height / 2) / 2;
      spouse.set(`${memberId}->${firstSpouse}`, {
        points: [
          { x: node.x + node.width, y },
          { x: sp.x, y },
        ],
      });
    }

    // Parent-child edges
    for (const childId of node.childIds) {
      const child = treeMap.get(childId);
      if (!child) continue;
      const busY =
        node.y + node.height +
        (child.y - node.y - node.height) / 2;
      parentChild.set(`${memberId}->${childId}`, {
        points: [
          { x: node.x + node.width / 2, y: node.y + node.height },
          { x: node.x + node.width / 2, y: busY },
          { x: child.x + child.width / 2, y: busY },
          { x: child.x + child.width / 2, y: child.y },
        ],
      });
      recurse(childId);
    }

    // Route first spouse → shared children (dual-parent edge convergence)
    if (firstSpouse && treeMap.has(firstSpouse)) {
      const spouseNode = treeMap.get(firstSpouse)!;
      for (const childId of spouseNode.childIds) {
        const child = treeMap.get(childId);
        if (!child) continue;
        const key = `${firstSpouse}->${childId}`;
        if (!parentChild.has(key)) {
          const busY =
            node.y + node.height +
            (child.y - node.y - node.height) / 2;
          parentChild.set(key, {
            points: [
              { x: spouseNode.x + spouseNode.width / 2, y: spouseNode.y + spouseNode.height },
              { x: spouseNode.x + spouseNode.width / 2, y: busY },
              { x: child.x + child.width / 2, y: busY },
              { x: child.x + child.width / 2, y: child.y },
            ],
          });
        }
      }
    }
  }

  recurse(rootId);
  return { parentChild, spouse };
}
