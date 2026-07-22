"use client";

import { cn } from "@/lib/utils/cn";
import type { TreeMode } from "@/types/tree";

interface TreeModeSelectorProps {
  currentMode: TreeMode;
  onModeChange: (mode: TreeMode) => void;
}

const MODES: { mode: TreeMode; label: string; description: string }[] = [
  {
    mode: "expand",
    label: "Cây Mở Rộng",
    description: "Đầy đủ vợ/chồng và con cái",
  },
  {
    mode: "simple",
    label: "Cây Đơn Giản",
    description: "Một vợ/chồng chính",
  },
  {
    mode: "group",
    label: "Cây Theo Đời",
    description: "Nhóm thành viên theo đời",
  },
];

export function TreeModeSelector({
  currentMode,
  onModeChange,
}: TreeModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      {MODES.map(({ mode, label, description }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          title={description}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            "hover:bg-background/50",
            currentMode === mode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
