/**
 * Convert internal layout engine results to React Flow Node[] and Edge[].
 */

import type { Node, Edge } from "@xyflow/react";
import type { TreeData, PersonNodeData, ParentChildEdgeData, SpouseEdgeData } from "@/types/tree";
import type { TreeNode, MemberId, LayoutResult, EdgeRoute } from "./layout-types";

/**
 * Convert layout positions + tree data → React Flow nodes.
 */
export function toReactFlowNodes(
  treeMap: Map<MemberId, TreeNode>,
  layout: LayoutResult,
  data: TreeData,
  rootId: MemberId | null
): Node[] {
  const nodes: Node[] = [];

  for (const member of data.members) {
    const treeNode = treeMap.get(member.id);
    if (!treeNode || !treeNode.positioned) continue;

    const position = layout.positions.get(member.id);
    if (!position) continue;

    nodes.push({
      id: member.id,
      type: "personNode",
      position: { x: position.x, y: position.y },
      data: {
        memberId: member.id,
        fullName: member.fullName,
        alias: member.alias || null,
        gender: member.gender,
        birthDate: member.birthDate || null,
        deathDate: member.deathDate || null,
        isLiving: member.isLiving === 1,
        photoUrl: member.photoUrl || null,
        generation: member.generation,
        birthOrder: member.birthOrder || null,
        spouseCount: member.spouseCount || 0,
        childrenCount: member.childrenCount || 0,
        isRoot: member.id === rootId,
        // GPĐV-specific card sizing
        cardWidth: position.width,
        cardHeight: position.height,
      } satisfies PersonNodeData,
    });
  }

  return nodes;
}

/**
 * Convert layout edge routes + relationship data → React Flow edges.
 */
export function toReactFlowEdges(
  layout: LayoutResult,
  data: TreeData
): Edge[] {
  const edges: Edge[] = [];

  // ---- Parent-child edges ----
  for (const rel of data.relationships) {
    const key = `${rel.parentId}->${rel.childId}`;
    const route = layout.edgeRoutes.parentChild.get(key);

    const edgeData: ParentChildEdgeData = {
      relationshipType: rel.relationshipType,
    };

    edges.push({
      id: `parent-${rel.id}`,
      source: rel.parentId,
      target: rel.childId,
      type: "parentChild",
      data: {
        ...edgeData,
        route: route || null,
      },
      style: {
        stroke:
          rel.relationshipType === "adoptive" ? "#94a3b8" : "#3b82f6",
        strokeWidth: rel.relationshipType === "adoptive" ? 1.5 : 2,
        strokeDasharray:
          rel.relationshipType === "adoptive" ? "5,5" : undefined,
      },
    });
  }

  // ---- Spouse edges ----
  for (const marriage of data.marriages) {
    if (marriage.isActive !== 1) continue;

    // Try both key orders
    let route =
      layout.edgeRoutes.spouse.get(
        `${marriage.partner1Id}->${marriage.partner2Id}`
      ) ||
      layout.edgeRoutes.spouse.get(
        `${marriage.partner2Id}->${marriage.partner1Id}`
      );

    const edgeData: SpouseEdgeData = {
      marriageDate: marriage.marriageDate || null,
      isActive: marriage.isActive === 1,
    };

    edges.push({
      id: `spouse-${marriage.id}`,
      source: marriage.partner1Id,
      target: marriage.partner2Id,
      type: "spouse",
      data: {
        ...edgeData,
        route: route || null,
      },
      style: {
        stroke: "#ec4899",
        strokeWidth: 2,
        strokeDasharray: marriage.divorceDate ? "5,5" : undefined,
      },
    });
  }

  return edges;
}

/**
 * Convert full pipeline: build tree → layout → React Flow output.
 */
export function buildAndLayout(
  data: TreeData,
  rootId: string | null,
  layoutFn: (
    rootId: MemberId,
    treeMap: Map<MemberId, TreeNode>
  ) => LayoutResult,
  buildTreeFn: (
    data: TreeData,
    rootId: string | null
  ) => { treeMap: Map<MemberId, TreeNode>; rootId: MemberId }
): {
  nodes: Node[];
  edges: Edge[];
  rootId: string | null;
} {
  const { treeMap, rootId: determinedRoot } = buildTreeFn(data, rootId);

  if (!determinedRoot || !treeMap.has(determinedRoot)) {
    return { nodes: [], edges: [], rootId: null };
  }

  const layout = layoutFn(determinedRoot, treeMap);

  return {
    nodes: toReactFlowNodes(treeMap, layout, data, determinedRoot),
    edges: toReactFlowEdges(layout, data),
    rootId: determinedRoot,
  };
}
