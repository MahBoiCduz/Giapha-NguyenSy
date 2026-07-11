// Custom node data for React Flow
export interface PersonNodeData {
  memberId: string;
  fullName: string;
  alias: string | null;
  gender: "male" | "female";
  birthDate: string | null;
  deathDate: string | null;
  isLiving: boolean;
  photoUrl: string | null;
  generation: number;
  birthOrder: number | null;
  spouseCount: number;
  childrenCount: number;
  isRoot: boolean;
}

// Custom edge data
export interface ParentChildEdgeData {
  relationshipType: "biological" | "adoptive";
}

export interface SpouseEdgeData {
  marriageDate: string | null;
  isActive: boolean;
}

// Tree direction
export type TreeDirection = "up" | "down";

// Tree style
export type EdgeStyle = "step" | "smoothstep" | "bezier";

// Tree query parameters
export interface TreeQueryParams {
  rootId?: string;
  generations: number;
  direction: TreeDirection;
}

// Tree data from API
export interface TreeData {
  clan: {
    id: string;
    name: string;
  };
  members: Array<{
    id: string;
    fullName: string;
    alias: string | null;
    familyName: string;
    middleName: string | null;
    givenName: string;
    gender: "male" | "female";
    birthDate: string | null;
    deathDate: string | null;
    isLiving: number;
    photoUrl: string | null;
    generation: number;
    birthOrder: number | null;
    spouseCount?: number;
    childrenCount?: number;
  }>;
  marriages: Array<{
    id: string;
    partner1Id: string;
    partner2Id: string;
    marriageDate: string | null;
    divorceDate: string | null;
    isActive: number;
  }>;
  relationships: Array<{
    id: string;
    parentId: string;
    childId: string;
    marriageId: string | null;
    relationshipType: "biological" | "adoptive";
    birthOrder: number | null;
  }>;
}
