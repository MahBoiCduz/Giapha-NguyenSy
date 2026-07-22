// ============================================================
// Internal types for the GPĐV-inspired custom layout engine
// ============================================================

/** A member ID is just a string */
export type MemberId = string;

/** Tree display mode */
export type TreeMode = "simple" | "expand" | "group";

/** Direction for first spouse positioning */
export type SpouseDirection = "left" | "right";

/** Group tree layout direction */
export type GroupDirection = "top-down" | "left-right";

// ---- Layout configuration ----

export interface LayoutConfig {
  /** Vertical gap between a member's bottom and their child's top */
  verticalSpacing: number;
  /** Horizontal gap between sibling cards */
  horizontalSpacing: number;
  /** Scale multiplier for the root member's card (default 2.0) */
  rootScale: number;
  /** Default card width (before any scaling) */
  cardWidth: number;
  /** Default card height (before any scaling) */
  cardHeight: number;
  /** Layout direction: "down" = ancestor on top, "up" = ancestor on bottom */
  direction: "down" | "up";
  /** Where the first spouse sits relative to the main member */
  firstSpouseDirection: SpouseDirection;
  /** Gap between a member and their spouse horizontally */
  spouseGap: number;
}

// ---- Tree node (internal representation during layout) ----

export interface TreeNode {
  memberId: MemberId;
  fullName: string;
  gender: "male" | "female";
  isDeceased: boolean;
  generation: number;
  birthOrder: number | null;

  /** Card dimensions (after applying scale) */
  width: number;
  height: number;

  /** Position computed by the layout algorithm */
  x: number;
  y: number;

  /** Relationship arrays (MemberId references) */
  spouseIds: MemberId[];
  /** Children sorted by mother-group then birth-order */
  childIds: MemberId[];
  parentIds: MemberId[];

  /** Subtree boundary tracking (mirrors GPĐV miMaxTreeRight / miMinTreeLeft) */
  subtreeLeft: number;
  subtreeRight: number;

  /** Whether this node has been positioned yet */
  positioned: boolean;

  /** Which marriage each child belongs to (childId → marriageId) */
  childMarriageMap: Map<MemberId, string | null>;
}

// ---- Layout result ----

export interface PositionInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  /** Computed positions for every member */
  positions: Map<MemberId, PositionInfo>;
  /** Overall bounding box of the tree */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /** Pre-computed edge routes for rendering */
  edgeRoutes: EdgeRouteMap;
}

// ---- Edge routes ----

export interface Point {
  x: number;
  y: number;
}

export interface EdgeRoute {
  /** Ordered polyline points */
  points: Point[];
}

export interface EdgeRouteMap {
  /** parent-child edges: key = `${parentId}->${childId}` */
  parentChild: Map<string, EdgeRoute>;
  /** spouse edges: key = `${partner1Id}->${partner2Id}` */
  spouse: Map<string, EdgeRoute>;
}
