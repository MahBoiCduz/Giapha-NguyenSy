"use client";

import { memo } from "react";
import { BaseEdge, type EdgeProps } from "@xyflow/react";
import type { SpouseEdgeData } from "@/types/tree";

function SpouseEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style = {},
}: EdgeProps & { data?: SpouseEdgeData }) {
  const isDivorced = data?.isActive === false;

  // Use pre-computed route from layout engine if available
  let edgePath: string;

  if (data?.route?.points && data.route.points.length >= 2) {
    const pts = data.route.points;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    edgePath = d;
  } else {
    // Fallback: L-shaped horizontal connection
    const midY = (sourceY + targetY) / 2;
    edgePath = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        ...style,
        stroke: isDivorced ? "#94a3b8" : style?.stroke || "#ec4899",
        strokeDasharray: isDivorced ? "5,5" : undefined,
        strokeWidth: 2,
      }}
    />
  );
}

export const SpouseEdge = memo(SpouseEdgeComponent);
