"use client";

import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Share2,
  ChevronDown,
  MousePointer2,
} from "lucide-react";
import { useState, useRef } from "react";
import type { EdgeStyle } from "@/types/tree";

interface FamilyTreeToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onExportPng: () => void;
  onExportJpg: () => void;
  onExportPdf: () => void;
  onEdgeStyleChange: (style: EdgeStyle) => void;
  currentEdgeStyle: EdgeStyle;
}

export function FamilyTreeToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onExportPng,
  onExportJpg,
  onExportPdf,
  onEdgeStyleChange,
  currentEdgeStyle,
}: FamilyTreeToolbarProps) {
  const [showExport, setShowExport] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);

  const edgeStyles: { value: EdgeStyle; label: string }[] = [
    { value: "step", label: "Bậc thang" },
    { value: "smoothstep", label: "Bo góc" },
    { value: "bezier", label: "Đường cong" },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-background/90 backdrop-blur rounded-lg border shadow-sm p-1">
      {/* Zoom controls */}
      <Button variant="ghost" size="icon" onClick={onZoomIn} title="Phóng to">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onZoomOut} title="Thu nhỏ">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onFitView} title="Xem toàn bộ">
        <Maximize2 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Edge style */}
      <div className="relative" ref={styleRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowStyle(!showStyle)}
          className="gap-1"
        >
          <MousePointer2 className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Kiểu nối</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
        {showStyle && (
          <div className="absolute top-full left-0 mt-1 w-36 rounded-md border bg-popover shadow-md py-1">
            {edgeStyles.map((s) => (
              <button
                key={s.value}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${
                  currentEdgeStyle === s.value ? "font-medium text-primary" : ""
                }`}
                onClick={() => {
                  onEdgeStyleChange(s.value);
                  setShowStyle(false);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="relative" ref={exportRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExport(!showExport)}
          className="gap-1"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Xuất</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
        {showExport && (
          <div className="absolute top-full left-0 mt-1 w-36 rounded-md border bg-popover shadow-md py-1">
            <button
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
              onClick={() => {
                onExportPng();
                setShowExport(false);
              }}
            >
              Xuất PNG
            </button>
            <button
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
              onClick={() => {
                onExportJpg();
                setShowExport(false);
              }}
            >
              Xuất JPG
            </button>
            <button
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-accent"
              onClick={() => {
                onExportPdf();
                setShowExport(false);
              }}
            >
              Xuất PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
