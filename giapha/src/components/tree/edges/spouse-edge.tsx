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
  const midY = (sourceY + targetY) / 2;
  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;

  const isDivorced = data?.isActive === false;

  return (
    <BaseEdge
      id={id}
      path={path}
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
