import type { TreeData, PersonNodeData } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEdge = any;

interface TransformResult {
  nodes: AnyNode[];
  edges: AnyEdge[];
  rootId: string | null;
}

/**
 * Transform raw DB tree data into React Flow nodes and edges.
 */
export function transformTreeData(data: TreeData, rootId?: string): TransformResult {
  // Build nodes
  const nodes: AnyNode[] = data.members.map((member, index) => ({
    id: member.id,
    type: "personNode",
    position: { x: index * 200, y: member.generation * 150 },
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
    } satisfies PersonNodeData,
  }));

  // Build parent-child edges
  const edges: AnyEdge[] = data.relationships.map((rel) => ({
    id: `parent-${rel.id}`,
    source: rel.parentId,
    target: rel.childId,
    type: "parentChild",
    data: {
      relationshipType: rel.relationshipType,
    },
    style: {
      stroke: rel.relationshipType === "adoptive" ? "#94a3b8" : "#3b82f6",
      strokeWidth: rel.relationshipType === "adoptive" ? 1.5 : 2,
      strokeDasharray: rel.relationshipType === "adoptive" ? "5,5" : undefined,
    },
  }));

  // Build spouse edges
  const spouseEdges: AnyEdge[] = data.marriages
    .filter((m) => m.isActive === 1)
    .map((marriage) => ({
      id: `spouse-${marriage.id}`,
      source: marriage.partner1Id,
      target: marriage.partner2Id,
      type: "spouse",
      data: {
        marriageDate: marriage.marriageDate || null,
        isActive: marriage.isActive === 1,
      },
      style: {
        stroke: "#ec4899",
        strokeWidth: 2,
        strokeDasharray: marriage.divorceDate ? "5,5" : undefined,
      },
    }));

  edges.push(...spouseEdges);

  // Determine root
  const determinedRootId =
    rootId ||
    (data.members.length > 0
      ? data.members.reduce((min, m) =>
          m.generation < min.generation ? m : min
        ).id
      : null);

  return { nodes, edges, rootId: determinedRootId };
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
