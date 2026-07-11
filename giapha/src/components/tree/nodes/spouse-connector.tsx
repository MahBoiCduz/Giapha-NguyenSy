"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";

/**
 * A small connector node that sits between spouses horizontally.
 * This node doesn't render anything visible; it's just a routing helper.
 */
function SpouseConnectorComponent() {
  return (
    <div className="w-0 h-0 opacity-0">
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}

export const SpouseConnector = memo(SpouseConnectorComponent);
