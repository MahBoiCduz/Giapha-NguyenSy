"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import type { ParentChildEdgeData } from "@/types/tree";

function ParentChildEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}: EdgeProps & { data?: ParentChildEdgeData }) {
  const isAdoptive = data?.relationshipType === "adoptive";

  // Use pre-computed route from layout engine if available
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (data?.route?.points && data.route.points.length >= 2) {
    // Build SVG path from route points
    const pts = data.route.points;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    edgePath = d;
    // Label at the horizontal bus midpoint
    if (pts.length >= 3) {
      labelX = (pts[1].x + pts[2].x) / 2;
      labelY = pts[1].y;
    } else {
      labelX = (pts[0].x + pts[pts.length - 1].x) / 2;
      labelY = (pts[0].y + pts[pts.length - 1].y) / 2;
    }
  } else {
    // Fallback: simple straight line
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeDasharray: isAdoptive ? "5,5" : undefined,
          stroke: isAdoptive ? "#94a3b8" : style?.stroke || "#3b82f6",
        }}
        markerEnd={markerEnd}
      />
      {isAdoptive && (
        <EdgeLabelRenderer>
          <div
            className="absolute text-[10px] text-muted-foreground bg-background px-1 rounded"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            Nhận nuôi
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const ParentChildEdge = memo(ParentChildEdgeComponent);
