import type { TreeData } from "@/types/tree";
import type { TreeNode, MemberId, LayoutConfig } from "./layout-types";
import { DEFAULT_LAYOUT_CONFIG } from "./layout-constants";

/**
 * Build a tree node map from flat DB data.
 * Creates the internal TreeNode structure required by the layout engine.
 */
export function buildTree(
  data: TreeData,
  rootId: string | null,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): { treeMap: Map<MemberId, TreeNode>; rootId: MemberId } {
  const treeMap = new Map<MemberId, TreeNode>();

  // ---- Step 1: Create TreeNode for each member ----
  for (const member of data.members) {
    const isRoot = member.id === rootId;
    const scale = isRoot ? config.rootScale : 1;

    treeMap.set(member.id, {
      memberId: member.id,
      fullName: member.fullName,
      gender: member.gender,
      isDeceased: member.isLiving === 0,
      generation: member.generation,
      birthOrder: member.birthOrder ?? null,
      width: config.cardWidth * scale,
      height: config.cardHeight * scale,
      x: 0,
      y: 0,
      spouseIds: [],
      childIds: [],
      parentIds: [],
      subtreeLeft: 0,
      subtreeRight: 0,
      positioned: false,
      childMarriageMap: new Map(),
    });
  }

  // ---- Step 2: Wire up spouse relationships from marriages ----
  for (const marriage of data.marriages) {
    const node1 = treeMap.get(marriage.partner1Id);
    const node2 = treeMap.get(marriage.partner2Id);
    if (!node1 || !node2) continue;

    // Add each as spouse of the other
    if (!node1.spouseIds.includes(marriage.partner2Id)) {
      node1.spouseIds.push(marriage.partner2Id);
    }
    if (!node2.spouseIds.includes(marriage.partner1Id)) {
      node2.spouseIds.push(marriage.partner1Id);
    }
  }

  // ---- Step 3: Wire up parent-child relationships ----
  for (const rel of data.relationships) {
    const parent = treeMap.get(rel.parentId);
    const child = treeMap.get(rel.childId);
    if (!parent || !child) continue;

    // Add child to parent
    if (!parent.childIds.includes(rel.childId)) {
      parent.childIds.push(rel.childId);
    }
    // Add parent to child
    if (!child.parentIds.includes(rel.parentId)) {
      child.parentIds.push(rel.parentId);
    }
    // Track which marriage this child belongs to
    parent.childMarriageMap.set(rel.childId, rel.marriageId);
  }

  // ---- Step 4: Determine root if not specified ----
  const determinedRootId = rootId ?? findRoot(treeMap, data.relationships);

  return { treeMap, rootId: determinedRootId };
}

/**
 * Auto-detect the root member (the one with the lowest generation who has no parents).
 * Falls back to lowest generation if no clear root exists.
 */
function findRoot(
  treeMap: Map<MemberId, TreeNode>,
  relationships: TreeData["relationships"]
): MemberId {
  if (treeMap.size === 0) return "";

  // Find members who have children but no parents (the true root)
  const parentIds = new Set(relationships.map((r) => r.parentId));
  const childIds = new Set(relationships.map((r) => r.childId));

  // Root candidates: have children but are not children of anyone in this tree
  const roots = [...treeMap.values()].filter(
    (n) => parentIds.has(n.memberId) && !childIds.has(n.memberId)
  );

  if (roots.length > 0) {
    // Pick the one with the lowest generation
    roots.sort((a, b) => a.generation - b.generation);
    return roots[0].memberId;
  }

  // No clear root → pick the member with the lowest generation
  const allNodes = [...treeMap.values()];
  allNodes.sort((a, b) => a.generation - b.generation);
  return allNodes[0].memberId;
}

/**
 * Sort a node's children: group by mother (spouse), then sort by birthOrder within each group.
 * Groups are ordered by spouse order (first spouse's children first).
 */
export function sortChildrenByMother(
  node: TreeNode,
  treeMap: Map<MemberId, TreeNode>
): MemberId[] {
  if (node.childIds.length === 0) return [];

  // Group children by which spouse is their mother/parent
  const groups = new Map<MemberId | "__unmatched__", MemberId[]>();

  for (const childId of node.childIds) {
    const child = treeMap.get(childId);
    if (!child) continue;

    // Find which of this node's spouses is also a parent of the child
    const matchingSpouse = child.parentIds.find(
      (pid) => pid !== node.memberId && node.spouseIds.includes(pid)
    );

    const groupKey: MemberId | "__unmatched__" = matchingSpouse ?? "__unmatched__";
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(childId);
  }

  // Sort within each group by birthOrder
  for (const [, children] of groups) {
    children.sort((a, b) => {
      const nodeA = treeMap.get(a);
      const nodeB = treeMap.get(b);
      const orderA = nodeA?.birthOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = nodeB?.birthOrder ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }

  // Flatten: spouse groups first (in spouse order), then unmatched
  const sorted: MemberId[] = [];
  for (const spouseId of node.spouseIds) {
    const group = groups.get(spouseId);
    if (group) sorted.push(...group);
  }
  const unmatched = groups.get("__unmatched__");
  if (unmatched) sorted.push(...unmatched);

  return sorted;
}
