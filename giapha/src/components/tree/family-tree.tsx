"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { PersonNode } from "./nodes/person-node";
import { SpouseConnector } from "./nodes/spouse-connector";
import { ParentChildEdge } from "./edges/parent-child-edge";
import { SpouseEdge } from "./edges/spouse-edge";
import { FamilyTreeToolbar } from "./family-tree-toolbar";
import { AddMemberDialog } from "./dialogs/add-member-dialog";
import { useTreeLayout } from "./hooks/use-tree-layout";
import { useTreeExport } from "./hooks/use-tree-export";
import { transformTreeData } from "@/lib/tree/transform";
import type { PersonNodeData, EdgeStyle, TreeDirection, TreeData } from "@/types/tree";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: any = {
  personNode: PersonNode,
  spouseConnector: SpouseConnector,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: any = {
  parentChild: ParentChildEdge,
  spouse: SpouseEdge,
};

interface FamilyTreeProps {
  treeData: TreeData;
  clanId: string;
}

export function FamilyTree({ treeData, clanId }: FamilyTreeProps) {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { exportToPng, exportToJpg, exportToPdf } = useTreeExport();

  const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>("step");
  const [direction, setDirection] = useState<TreeDirection>("down");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add-child" | "add-spouse">("add-child");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Transform data
  const { nodes: rawNodes, edges: rawEdges, rootId } = useMemo(
    () => transformTreeData(treeData),
    [treeData]
  );

  // Apply layout
  const { nodes, edges } = useTreeLayout({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodes: rawNodes as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    edges: rawEdges as any,
    rootId,
    direction,
    maxGenerations: 5,
  });

  // Handle node click → navigate to profile
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "personNode") {
        const data = node.data as unknown as PersonNodeData;
        router.push(`/dashboard/clans/${clanId}/members/${data.memberId}`);
      }
    },
    [router, clanId]
  );

  // Handle node double-click → quick edit
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "personNode") {
        const data = node.data as unknown as PersonNodeData;
        router.push(
          `/dashboard/clans/${clanId}/members/${data.memberId}/edit`
        );
      }
    },
    [router, clanId]
  );

  // Handle node right-click → context menu (add relative)
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (node.type === "personNode") {
        setSelectedMemberId((node.data as unknown as PersonNodeData).memberId);
        const action = window.prompt(
          "Thêm: 1=Con, 2=Vợ/Chồng (nhập 1 hoặc 2)"
        );
        if (action === "1") {
          setDialogMode("add-child");
          setDialogOpen(true);
        } else if (action === "2") {
          setDialogMode("add-spouse");
          setDialogOpen(true);
        }
      }
    },
    []
  );

  // Export handlers
  const handleExport = useCallback(
    async (format: "png" | "jpg" | "pdf") => {
      const viewport = reactFlowWrapper.current?.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement;
      if (!viewport) return;

      switch (format) {
        case "png":
          await exportToPng(viewport);
          break;
        case "jpg":
          await exportToJpg(viewport);
          break;
        case "pdf":
          await exportToPdf(viewport);
          break;
      }
    },
    [exportToPng, exportToJpg, exportToPdf]
  );

  const selectedMember = selectedMemberId
    ? treeData.members.find((m) => m.id === selectedMemberId)
    : null;

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={3}
        defaultEdgeOptions={{
          type: edgeStyle,
        }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as unknown as PersonNodeData | undefined;
            if (!data) return "#94a3b8";
            return data.gender === "male" ? "#3b82f6" : "#ec4899";
          }}
          maskColor="rgba(0,0,0,0.1)"
          className="!bottom-4 !right-4"
        />
      </ReactFlow>

      {/* Toolbar */}
      <FamilyTreeToolbar
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView({ padding: 0.3 })}
        onExportPng={() => handleExport("png")}
        onExportJpg={() => handleExport("jpg")}
        onExportPdf={() => handleExport("pdf")}
        onEdgeStyleChange={setEdgeStyle}
        currentEdgeStyle={edgeStyle}
      />

      {/* Quick Add Dialog */}
      <AddMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clanId={clanId}
        parentId={dialogMode === "add-child" ? selectedMemberId ?? undefined : undefined}
        spouseId={dialogMode === "add-spouse" ? selectedMemberId ?? undefined : undefined}
        suggestedGeneration={
          selectedMember
            ? selectedMember.generation + (dialogMode === "add-child" ? 1 : 0)
            : 1
        }
      />
    </div>
  );
}
