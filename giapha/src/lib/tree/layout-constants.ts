import type { LayoutConfig } from "./layout-types";

/**
 * Default layout configuration matching GPĐV's DrawTreeConfig defaults.
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  verticalSpacing: 200,
  horizontalSpacing: 30,
  rootScale: 1.0,
  cardWidth: 200,
  cardHeight: 140,
  direction: "down",
  firstSpouseDirection: "right",
  spouseGap: 40,
};

/** Color constants for edges (matching GPĐV palette) */
export const PARENT_CHILD_LINE_COLOR = "#3b82f6";
export const SPOUSE_LINE_COLOR = "#ec4899";
export const LINE_WIDTH = 2;
export const ADOPTIVE_LINE_COLOR = "#94a3b8";

/** Card template dimensions */
export const CARD_DIMENSIONS = {
  /** Full detail card (default) */
  full: { width: 200, height: 140 },
  /** Compact card for large trees */
  compact: { width: 160, height: 100 },
  /** Minimal card for performance mode */
  minimal: { width: 120, height: 60 },
} as const;
