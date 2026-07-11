"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils/cn";
import type { PersonNodeData } from "@/types/tree";

interface PersonNodeProps {
  data: PersonNodeData;
  selected?: boolean;
}

function PersonNodeComponent({ data, selected }: PersonNodeProps) {
  const getYears = () => {
    const birth = data.birthDate ? new Date(data.birthDate).getFullYear() : null;
    const death = data.deathDate ? new Date(data.deathDate).getFullYear() : null;

    if (!birth && !death) return "";
    if (birth && !death && data.isLiving) return `${birth} - nay`;
    if (birth && !death && !data.isLiving) return `${birth} - ?`;
    if (birth && death) return `${birth} - ${death}`;
    if (!birth && death) return `? - ${death}`;
    return "";
  };

  const initials = data.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Top handle (from parent) */}
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />

      <div
        className={cn(
          "relative w-[180px] rounded-lg border-2 bg-card shadow-md transition-shadow cursor-pointer",
          data.gender === "male"
            ? "border-blue-300 dark:border-blue-700"
            : "border-pink-300 dark:border-pink-700",
          data.isRoot && "ring-2 ring-primary ring-offset-1",
          selected && "border-primary shadow-lg ring-2 ring-primary/50",
          !data.isLiving && "opacity-75"
        )}
      >
        {/* Avatar area */}
        <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              data.gender === "male"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200"
            )}
          >
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt={data.fullName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate leading-tight">
              {data.fullName}
            </p>
            {data.alias && (
              <p className="text-[10px] text-muted-foreground truncate">
                ({data.alias})
              </p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-2 py-1.5 text-[10px] space-y-0.5">
          {getYears() && (
            <p className="text-muted-foreground text-center">{getYears()}</p>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Đời {data.generation}</span>
            {data.birthOrder && <span>Thứ {data.birthOrder}</span>}
          </div>
          <div className="flex justify-between text-muted-foreground">
            {data.spouseCount > 0 && (
              <span>{data.spouseCount} vợ/chồng</span>
            )}
            {data.childrenCount > 0 && (
              <span>{data.childrenCount} con</span>
            )}
          </div>
        </div>

        {/* Badge */}
        <div
          className={cn(
            "absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            data.gender === "male"
              ? "bg-blue-500 text-white"
              : "bg-pink-500 text-white"
          )}
        >
          {data.gender === "male" ? "♂" : "♀"}
        </div>

        {!data.isLiving && (
          <div className="absolute -top-2 -left-2 text-[10px]">🕊</div>
        )}
      </div>

      {/* Bottom handles (to children + spouse) */}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-right"
        className="!bg-pink-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-left"
        className="!bg-pink-400"
      />
    </>
  );
}

export const PersonNode = memo(PersonNodeComponent);
