/**
 * Transform raw DB tree data into raw React Flow nodes and edges.
 * NO layout is run here — layout is deferred to useTreeLayout / applyCustomLayout.
 */
import type { TreeData, PersonNodeData, ParentChildEdgeData, SpouseEdgeData } from "./types";
import { buildTree } from "./build-tree";
import { DEFAULT_LAYOUT_CONFIG } from "./layout-constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEdge = any;

interface TransformResult {
  nodes: AnyNode[];
  edges: AnyEdge[];
  rootId: string | null;
}

export function transformTreeData(
  data: TreeData,
  rootId?: string
): TransformResult {
  if (data.members.length === 0) {
    return { nodes: [], edges: [], rootId: null };
  }

  // Step 1: Build tree structure to determine root
  const { treeMap, rootId: determinedRoot } = buildTree(
    data,
    rootId ?? null,
    DEFAULT_LAYOUT_CONFIG
  );

  if (!determinedRoot || !treeMap.has(determinedRoot)) {
    return { nodes: [], edges: [], rootId: null };
  }

  // Step 2: Create raw React Flow nodes (positions will be set later by layout engine)
  const nodes: AnyNode[] = data.members.map((member) => {
    const isRoot = member.id === determinedRoot;
    return {
      id: member.id,
      type: "personNode",
      position: { x: 0, y: 0 },
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
        isRoot,
        // Card sizing set by layout engine; use defaults for now
        cardWidth: isRoot
          ? DEFAULT_LAYOUT_CONFIG.cardWidth * DEFAULT_LAYOUT_CONFIG.rootScale
          : DEFAULT_LAYOUT_CONFIG.cardWidth,
        cardHeight: isRoot
          ? DEFAULT_LAYOUT_CONFIG.cardHeight * DEFAULT_LAYOUT_CONFIG.rootScale
          : DEFAULT_LAYOUT_CONFIG.cardHeight,
      } satisfies PersonNodeData,
    };
  });

  // Step 3: Create raw edges (route will be set later by layout engine)
  const edges: AnyEdge[] = [];

  // Parent-child edges
  for (const rel of data.relationships) {
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
        marriageId: (rel as any).marriageId ?? null,
        route: null,
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

  // Spouse edges
  for (const marriage of data.marriages) {
    if (marriage.isActive !== 1) continue;

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
        route: null,
      },
      style: {
        stroke: "#ec4899",
        strokeWidth: 2,
        strokeDasharray: marriage.divorceDate ? "5,5" : undefined,
      },
    });
  }

  return { nodes, edges, rootId: determinedRoot };
}

/**
 * Count descendants of a member by ID.
 */
export function countDescendants(
  memberId: string,
  relationships: TreeData["relationships"]
): number {
  const children = relationships
    .filter((r) => r.parentId === memberId)
    .map((r) => r.childId);

  let count = children.length;
  for (const childId of children) {
    count += countDescendants(childId, relationships);
  }
  return count;
}
