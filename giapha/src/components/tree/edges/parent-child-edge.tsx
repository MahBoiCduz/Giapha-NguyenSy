"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
  });

  const isAdoptive = data?.relationshipType === "adoptive";

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
