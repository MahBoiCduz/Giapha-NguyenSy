/**
 * Relationship calculation utilities.
 * Given two members in a family tree, determine their relationship path.
 */

export interface MemberNode {
  id: string;
  fullName: string;
  gender: "male" | "female";
  generation: number;
}

export interface RelationshipEdge {
  parentId: string;
  childId: string;
  type: "parent-child";
}

export interface MarriageEdge {
  partner1Id: string;
  partner2Id: string;
}

/**
 * Build an adjacency map for parent-child relationships.
 */
function buildAdjacencyMap(
  edges: RelationshipEdge[]
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    // Bidirectional: parent ↔ child
    if (!adj.has(edge.parentId)) adj.set(edge.parentId, []);
    if (!adj.has(edge.childId)) adj.set(edge.childId, []);
    adj.get(edge.parentId)!.push(edge.childId);
    adj.get(edge.childId)!.push(edge.parentId);
  }
  return adj;
}

/**
 * Find the relationship path between two members using BFS.
 * Returns the ordered list of member IDs from source to target, or null if no path exists.
 */
export function findRelationshipPath(
  members: Map<string, MemberNode>,
  relationships: RelationshipEdge[],
  sourceId: string,
  targetId: string
): string[] | null {
  const adjacency = buildAdjacencyMap(relationships);

  if (!adjacency.has(sourceId) || !adjacency.has(targetId)) {
    return null;
  }

  const queue: string[][] = [[sourceId]];
  const visited = new Set<string>();
  visited.add(sourceId);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentId = path[path.length - 1];

    if (currentId === targetId) {
      return path;
    }

    const neighbors = adjacency.get(currentId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

/**
 * Determine the kinship term between two members in Vietnamese.
 * This is a simplified version; real kinship rules are much more complex.
 */
export function getVietnameseKinship(
  source: MemberNode,
  target: MemberNode,
  path: string[]
): string {
  if (source.id === target.id) return "Bản thân";

  const genDiff = target.generation - source.generation;

  // Same generation
  if (genDiff === 0) {
    return "Anh/Chị/Em";
  }

  // Target is ancestor
  if (genDiff < 0) {
    const levels = Math.abs(genDiff);
    if (levels === 1) return source.gender === "male" ? "Cha" : "Mẹ";
    if (levels === 2) return source.gender === "male" ? "Ông nội" : "Ông ngoại";
    return `Tổ tiên (${levels} đời)`;
  }

  // Target is descendant
  if (genDiff > 0) {
    const levels = genDiff;
    if (levels === 1) return source.gender === "male" ? "Con trai" : "Con gái";
    if (levels === 2) return source.gender === "male" ? "Cháu nội" : "Cháu ngoại";
    return `Hậu duệ (${levels} đời)`;
  }

  return "Có quan hệ họ hàng";
}
