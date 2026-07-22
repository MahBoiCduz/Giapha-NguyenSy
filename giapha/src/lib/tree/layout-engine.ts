/**
 * Core recursive tree layout engine inspired by Gia Phả Đại Việt's
 * ExpandCoordinateBuilder.MakeCoordinateTree().
 *
 * Algorithm overview:
 * 1. Recursively layout children top-down
 * 2. Center parent between first & last child
 * 3. Position spouses to the left/right
 * 4. Compute subtree boundary extents
 *
 * This is a PURE function — no side effects outside the treeMap.
 */

import type {
  TreeNode,
  MemberId,
  LayoutConfig,
  LayoutResult,
  PositionInfo,
  Point,
  EdgeRouteMap,
  EdgeRoute,
} from "./layout-types";
import { sortChildrenByMother } from "./build-tree";
import { DEFAULT_LAYOUT_CONFIG } from "./layout-constants";

// ============================================================
// Public API
// ============================================================

export function computeExpandLayout(
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

  // Sort all children recursively first
  sortAllChildren(rootId, treeMap);

  // Run recursive layout
  const startX = 0;
  const startY = 0;
  layoutSubtree(rootId, treeMap, config, startX, startY);

  // Post-processing: adjust earlier sibling positions
  updateSiblingPositions(rootId, treeMap, config);

  // Compute bounds
  const bounds = computeBounds(treeMap);

  // Extract positions
  const positions = extractPositions(treeMap);

  // Compute edge routes
  const edgeRoutes = computeAllEdgeRoutes(rootId, treeMap, config);

  return { positions, bounds, edgeRoutes };
}

// ============================================================
// Recursive sort of all children in the tree
// ============================================================

function sortAllChildren(
  memberId: MemberId,
  treeMap: Map<MemberId, TreeNode>
): void {
  const node = treeMap.get(memberId);
  if (!node) return;

  // Sort this node's children
  node.childIds = sortChildrenByMother(node, treeMap);

  // Recurse into children
  for (const childId of node.childIds) {
    sortAllChildren(childId, treeMap);
  }
}

// ============================================================
// Core recursive layout function
// ============================================================

function layoutSubtree(
  memberId: MemberId,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig,
  xOffset: number,
  yOffset: number
): void {
  const node = treeMap.get(memberId);
  if (!node || node.positioned) return;

  node.y = yOffset;

  const hasChildren =
    node.childIds.length > 0 &&
    node.childIds.some((cid) => treeMap.has(cid));

  // ---- Base case: no children in tree data ----
  if (!hasChildren) {
    layoutLeafNode(node, treeMap, config, xOffset);
    return;
  }

  // ---- Recursive case: layout children first ----
  layoutChildrenOfNode(node, treeMap, config, xOffset, yOffset);
}

/**
 * Layout a leaf node (no children).
 */
function layoutLeafNode(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig,
  xOffset: number
): void {
  // If LeftMember direction with 2+ spouses, offset right to make room
  if (
    config.firstSpouseDirection === "left" &&
    node.spouseIds.length >= 2
  ) {
    node.x = xOffset + node.width + config.spouseGap;
  } else {
    node.x = xOffset;
  }

  positionSpouses(node, treeMap, config, true);
  node.positioned = true;
}

/**
 * Layout all children of a node horizontally, then center the parent.
 */
function layoutChildrenOfNode(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig,
  xOffset: number,
  yOffset: number
): void {
  const verticalGap = node.height + config.verticalSpacing;
  const childrenY = yOffset + verticalGap;

  // Filter to children that exist in the tree
  const validChildren = node.childIds.filter((cid) =>
    treeMap.has(cid)
  );

  if (validChildren.length === 0) {
    layoutLeafNode(node, treeMap, config, xOffset);
    return;
  }

  // Layout first child
  let currentX = xOffset;
  layoutSubtree(
    validChildren[0],
    treeMap,
    config,
    currentX,
    childrenY
  );
  currentX = treeMap.get(validChildren[0])!.subtreeRight;

  // Layout remaining children sequentially
  for (let i = 1; i < validChildren.length; i++) {
    layoutSubtree(
      validChildren[i],
      treeMap,
      config,
      currentX,
      childrenY
    );
    currentX = treeMap.get(validChildren[i])!.subtreeRight;
  }

  // Center parent between children
  centerBetweenChildren(node, treeMap, config, validChildren, xOffset);

  // Position spouses around the centered member
  positionSpouses(node, treeMap, config, false);

  node.positioned = true;
}

/**
 * Center a parent between their first and last child.
 * Mirrors GPĐV's CenterMemberWithChildrent().
 */
function centerBetweenChildren(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig,
  validChildren: MemberId[],
  fallbackX: number
): void {
  const firstChild = treeMap.get(validChildren[0]);
  const lastChild = treeMap.get(validChildren[validChildren.length - 1]);

  if (!firstChild || !lastChild) {
    node.x = fallbackX;
    node.subtreeRight =
      fallbackX + node.width + config.horizontalSpacing;
    return;
  }

  if (node.spouseIds.length === 0) {
    // No spouses: simple centering between child extents
    const leftExtent = getLeftmostExtent(firstChild, treeMap);
    const rightExtent = getRightmostExtent(lastChild, treeMap);
    node.x = (leftExtent + rightExtent) / 2 - node.width / 2;
  } else if (node.spouseIds.length > 1) {
    // Multiple spouses: center only between children (not spouse extents)
    node.x =
      (firstChild.x +
        lastChild.x +
        lastChild.width * (firstChild === lastChild ? 1 : 1)) /
        2 -
      node.width / 2;
  } else {
    // Single spouse: include spouse extents in centering
    const leftExtent = getLeftmostWithSpouse(firstChild, treeMap);
    const rightExtent = getRightmostWithSpouse(lastChild, treeMap);
    node.x =
      (leftExtent + rightExtent) / 2 -
      (node.width + config.spouseGap) / 2;
  }

  // Don't let parent go left of the first child's leftmost extent
  const firstLeftExtent = getLeftmostExtent(firstChild, treeMap);
  if (node.x < firstLeftExtent) {
    node.x = firstLeftExtent;
  }

  // Clamp to xOffset
  if (node.x < fallbackX) {
    node.x = fallbackX;
  }

  // Update subtree boundaries
  node.subtreeLeft = Math.min(
    node.x,
    getLeftmostExtent(firstChild, treeMap)
  );
  node.subtreeRight = Math.max(
    node.x + node.width + config.horizontalSpacing,
    getRightmostExtent(lastChild, treeMap)
  );
}

// ============================================================
// Spouse positioning
// ============================================================

/**
 * Position spouses relative to the member.
 * Mirrors GPĐV's UpdateSpousePosition().
 */
function positionSpouses(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig,
  isLeaf: boolean
): void {
  if (node.spouseIds.length === 0) {
    node.subtreeRight =
      node.x + node.width + config.horizontalSpacing;
    node.subtreeLeft = node.x;
    return;
  }

  const validSpouses = node.spouseIds.filter((sid) =>
    treeMap.has(sid)
  );

  if (validSpouses.length === 0) {
    node.subtreeRight =
      node.x + node.width + config.horizontalSpacing;
    node.subtreeLeft = node.x;
    return;
  }

  const useLeftMember =
    config.firstSpouseDirection === "left" &&
    validSpouses.length >= 2;

  if (useLeftMember) {
    // First spouse goes LEFT, second+ go RIGHT
    positionFirstSpouseLeft(
      node,
      validSpouses,
      treeMap,
      config
    );
  } else {
    // All spouses go RIGHT
    positionAllSpousesRight(node, validSpouses, treeMap, config);
  }

  // Update subtree boundaries
  updateSubtreeBoundaries(node, treeMap, config);
}

/**
 * Position first spouse on the left, remaining on the right.
 */
function positionFirstSpouseLeft(
  node: TreeNode,
  validSpouses: MemberId[],
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig
): void {
  const firstSpouse = treeMap.get(validSpouses[0])!;
  firstSpouse.y = node.y;
  firstSpouse.positioned = true;

  // Find common children between node & first spouse
  const commonChildren = firstSpouse.childIds.filter((cid) =>
    node.childIds.includes(cid)
  );

  if (commonChildren.length >= 2) {
    // Multiple common children: align to leftmost child
    let leftmostX = Infinity;
    for (const cid of commonChildren) {
      const c = treeMap.get(cid);
      if (c && c.x < leftmostX) leftmostX = c.x;
    }
    firstSpouse.x = leftmostX;
  } else if (commonChildren.length === 1) {
    const onlyChild = treeMap.get(commonChildren[0])!;
    firstSpouse.x = onlyChild.x;
  } else {
    // No children: position left of member
    firstSpouse.x = node.x - firstSpouse.width - config.spouseGap;
  }

  // If first spouse overlaps with member, push member right
  const firstSpouseRight =
    firstSpouse.x + firstSpouse.width + config.spouseGap;
  if (firstSpouseRight > node.x) {
    node.x = firstSpouseRight;
  }

  // Position remaining spouses to the right
  if (validSpouses.length > 1) {
    let prevX = node.x + node.width + config.spouseGap;
    for (let i = 1; i < validSpouses.length; i++) {
      const spouse = treeMap.get(validSpouses[i])!;
      spouse.y = node.y;
      spouse.x = prevX;
      spouse.positioned = true;
      prevX = spouse.x + spouse.width + config.spouseGap;
    }
  }
}

/**
 * Position all spouses to the right of the member.
 */
function positionAllSpousesRight(
  node: TreeNode,
  validSpouses: MemberId[],
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig
): void {
  let prevX = node.x + node.width + config.spouseGap;

  for (const spouseId of validSpouses) {
    const spouse = treeMap.get(spouseId)!;
    spouse.y = node.y;
    spouse.x = prevX;
    spouse.positioned = true;
    prevX = spouse.x + spouse.width + config.spouseGap;
  }
}

/**
 * Update subtreeLeft & subtreeRight after spouse positioning.
 */
function updateSubtreeBoundaries(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig
): void {
  let minX = node.x;
  let maxX = node.x + node.width + config.horizontalSpacing;

  for (const spouseId of node.spouseIds) {
    const spouse = treeMap.get(spouseId);
    if (!spouse) continue;
    if (spouse.x < minX) minX = spouse.x;
    const spouseRight = spouse.x + spouse.width + config.horizontalSpacing;
    if (spouseRight > maxX) maxX = spouseRight;
  }

  // Also include children's extents
  for (const childId of node.childIds) {
    const child = treeMap.get(childId);
    if (!child) continue;
    if (child.subtreeLeft < minX) minX = child.subtreeLeft;
    if (child.subtreeRight > maxX) maxX = child.subtreeRight;
  }

  node.subtreeLeft = minX;
  node.subtreeRight = maxX;
}

// ============================================================
// Sibling position adjustment
// ============================================================

/**
 * Post-processing: shift earlier siblings right if later siblings
 * overlap them. Mirrors GPĐV's UpdatePositionPreBrother().
 */
function updateSiblingPositions(
  memberId: MemberId,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig
): void {
  const node = treeMap.get(memberId);
  if (!node) return;

  // Recurse into children first
  for (const childId of node.childIds) {
    updateSiblingPositions(childId, treeMap, config);
  }

  // Adjust sibling spacing
  const validChildren = node.childIds.filter((cid) =>
    treeMap.has(cid)
  );

  for (let i = 1; i < validChildren.length; i++) {
    const prev = treeMap.get(validChildren[i - 1])!;
    const curr = treeMap.get(validChildren[i])!;

    // If current overlaps previous, shift current right
    const minGap = config.horizontalSpacing;
    const prevRight = prev.subtreeRight;
    const currLeft = curr.subtreeLeft;

    if (currLeft < prevRight + minGap) {
      const shift = prevRight + minGap - currLeft;
      shiftSubtree(curr.memberId, treeMap, shift);
    }
  }
}

/**
 * Shift an entire subtree right by a given amount.
 */
function shiftSubtree(
  memberId: MemberId,
  treeMap: Map<MemberId, TreeNode>,
  delta: number
): void {
  const node = treeMap.get(memberId);
  if (!node) return;

  node.x += delta;
  node.subtreeLeft += delta;
  node.subtreeRight += delta;

  // Shift spouses
  for (const spouseId of node.spouseIds) {
    const spouse = treeMap.get(spouseId);
    if (spouse) {
      spouse.x += delta;
      spouse.subtreeLeft += delta;
      spouse.subtreeRight += delta;
    }
  }

  // Recurse into children
  for (const childId of node.childIds) {
    shiftSubtree(childId, treeMap, delta);
  }
}

// ============================================================
// Extent helpers
// ============================================================

function getLeftmostExtent(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>
): number {
  let minX = node.x;
  for (const spouseId of node.spouseIds) {
    const spouse = treeMap.get(spouseId);
    if (spouse && spouse.x < minX) minX = spouse.x;
  }
  return minX;
}

function getRightmostExtent(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>
): number {
  let maxX = node.x + node.width;
  for (const spouseId of node.spouseIds) {
    const spouse = treeMap.get(spouseId);
    if (spouse) {
      const right = spouse.x + spouse.width;
      if (right > maxX) maxX = right;
    }
  }
  return maxX;
}

function getLeftmostWithSpouse(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>
): number {
  return Math.min(node.subtreeLeft, getLeftmostExtent(node, treeMap));
}

function getRightmostWithSpouse(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>
): number {
  return Math.max(node.subtreeRight, getRightmostExtent(node, treeMap));
}

// ============================================================
// Bounds & position extraction
// ============================================================

function computeBounds(treeMap: Map<MemberId, TreeNode>) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [, node] of treeMap) {
    if (!node.positioned) continue;
    if (node.x < minX) minX = node.x;
    if (node.y < minY) minY = node.y;
    const right = node.x + node.width;
    const bottom = node.y + node.height;
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
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

// ============================================================
// Edge route computation
// ============================================================

/**
 * Compute all edge routes for the tree.
 * Uses GPĐV-style routing: parent→child uses bus lines,
 * spouse connections are horizontal.
 */
function computeAllEdgeRoutes(
  rootId: MemberId,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig
): EdgeRouteMap {
  const parentChild = new Map<string, EdgeRoute>();
  const spouse = new Map<string, EdgeRoute>();

  computeAllEdgeRoutesRecursive(rootId, treeMap, config, parentChild, spouse);

  return { parentChild, spouse };
}

function computeAllEdgeRoutesRecursive(
  memberId: MemberId,
  treeMap: Map<MemberId, TreeNode>,
  config: LayoutConfig,
  parentChild: Map<string, EdgeRoute>,
  spouse: Map<string, EdgeRoute>
): void {
  const node = treeMap.get(memberId);
  if (!node) return;

  // Spouse edges
  for (const spouseId of node.spouseIds) {
    const spouseNode = treeMap.get(spouseId);
    if (!spouseNode) continue;

    // Only create one edge per pair (when memberId < spouseId)
    if (memberId < spouseId) {
      const key = `${memberId}->${spouseId}`;
      if (!spouse.has(key)) {
        spouse.set(key, routeSpouseEdge(node, spouseNode));
      }
    }
  }

  // Parent-child edges with bus line optimization
  const validChildren = node.childIds.filter((cid) =>
    treeMap.has(cid)
  );

  if (validChildren.length > 0) {
    // Compute base bus line for this parent
    const baseBusLine = computeBusLine(node, validChildren, treeMap, config);

    // Extend bus line to also cover spouse positions
    // This ensures shared children have converging edges from both parents
    let leftX = baseBusLine.leftX;
    let rightX = baseBusLine.rightX;

    for (const spouseId of node.spouseIds) {
      const spouseNode = treeMap.get(spouseId);
      if (!spouseNode) continue;

      const spouseCenterX = spouseNode.x + spouseNode.width / 2;
      if (spouseCenterX < leftX) leftX = spouseCenterX;
      if (spouseCenterX > rightX) rightX = spouseCenterX;
    }

    const extendedBusLine = {
      busY: baseBusLine.busY,
      leftX,
      rightX,
    };

    // Route primary parent's child edges
    for (const childId of validChildren) {
      const child = treeMap.get(childId)!;
      const key = `${memberId}->${childId}`;
      parentChild.set(key, routeParentChildEdge(node, child, extendedBusLine));
    }

    // Route spouse→child edges for shared children
    for (const spouseId of node.spouseIds) {
      const spouseNode = treeMap.get(spouseId);
      if (!spouseNode) continue;

      const spouseChildren = spouseNode.childIds.filter((cid) =>
        treeMap.has(cid)
      );

      for (const childId of spouseChildren) {
        const key = `${spouseId}->${childId}`;
        if (!parentChild.has(key)) {
          const child = treeMap.get(childId)!;
          parentChild.set(
            key,
            routeParentChildEdge(spouseNode, child, extendedBusLine)
          );
        }
      }
    }
  }

  // Recurse into children
  for (const childId of node.childIds) {
    computeAllEdgeRoutesRecursive(
      childId,
      treeMap,
      config,
      parentChild,
      spouse
    );
  }
}

/**
 * Route a spouse edge as a horizontal line between two spouses.
 */
function routeSpouseEdge(
  a: TreeNode,
  b: TreeNode
): EdgeRoute {
  const aCenterY = a.y + a.height / 2;
  const bCenterY = b.y + b.height / 2;
  const y = (aCenterY + bCenterY) / 2;

  let left: TreeNode;
  let right: TreeNode;
  if (a.x < b.x) {
    left = a;
    right = b;
  } else {
    left = b;
    right = a;
  }

  return {
    points: [
      { x: left.x + left.width, y },
      { x: right.x, y },
    ],
  };
}

/**
 * Compute bus line params for a parent with multiple children.
 * The bus line is a horizontal line at the midpoint between parent
 * and children, spanning from leftmost to rightmost child center.
 */
function computeBusLine(
  parent: TreeNode,
  validChildren: MemberId[],
  treeMap: Map<MemberId, TreeNode>,
  _config: LayoutConfig
): { busY: number; leftX: number; rightX: number } {
  const parentBottom = parent.y + parent.height;
  let minChildY = Infinity;

  for (const cid of validChildren) {
    const c = treeMap.get(cid);
    if (c && c.y < minChildY) minChildY = c.y;
  }

  const busY = parentBottom + (minChildY - parentBottom) / 2;

  let leftX = Infinity;
  let rightX = -Infinity;
  for (const cid of validChildren) {
    const c = treeMap.get(cid);
    if (!c) continue;
    const cx = c.x + c.width / 2;
    if (cx < leftX) leftX = cx;
    if (cx > rightX) rightX = cx;
  }

  return { busY, leftX, rightX };
}

/**
 * Route a single parent-child edge using the bus line pattern:
 * parent bottom → vertical drop → bus line (horizontal) → vertical drop → child top.
 */
function routeParentChildEdge(
  parent: TreeNode,
  child: TreeNode,
  busLine: { busY: number }
): EdgeRoute {
  const parentX = parent.x + parent.width / 2;
  const parentY = parent.y + parent.height;
  const childX = child.x + child.width / 2;
  const childY = child.y;

  return {
    points: [
      { x: parentX, y: parentY },           // Parent bottom center
      { x: parentX, y: busLine.busY },      // Vertical drop to bus line
      { x: childX, y: busLine.busY },       // Horizontal along bus
      { x: childX, y: childY },             // Vertical drop to child top
    ],
  };
}
