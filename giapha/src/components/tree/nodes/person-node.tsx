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
  const isRoot = data.isRoot;
  const cardWidth = data.cardWidth ?? 200;
  const cardHeight = data.cardHeight ?? 140;

  const getYears = () => {
    const birth = data.birthDate
      ? new Date(data.birthDate).getFullYear()
      : null;
    const death = data.deathDate
      ? new Date(data.deathDate).getFullYear()
      : null;

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

  const isMale = data.gender === "male";

  // GPĐV-inspired color palette
  const headerBg = isMale
    ? "bg-gradient-to-r from-blue-600 to-blue-500"
    : "bg-gradient-to-r from-pink-600 to-pink-500";
  const headerBgDeceased = "bg-gradient-to-r from-gray-400 to-gray-300";
  const avatarBg = isMale
    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
    : "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200";
  const borderColor = isMale
    ? "border-blue-400 dark:border-blue-600"
    : "border-pink-400 dark:border-pink-600";
  const borderColorDeceased = "border-gray-300 dark:border-gray-600";

  return (
    <>
      {/* Top handle (from parent) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-400"
      />

      <div
        className={cn(
          "relative rounded-lg border-2 bg-card shadow-md transition-shadow cursor-pointer flex flex-col overflow-hidden",
          !data.isLiving ? borderColorDeceased : borderColor,
          isRoot && "ring-2 ring-primary ring-offset-1 shadow-lg",
          selected && "border-primary shadow-lg ring-2 ring-primary/50",
          !data.isLiving && "opacity-80"
        )}
        style={{
          width: cardWidth,
          minHeight: cardHeight,
        }}
      >
        {/* GPĐV-style Header Bar */}
        <div
          className={cn(
            "px-2 py-1 text-white text-center font-semibold text-xs flex items-center justify-between",
            !data.isLiving ? headerBgDeceased : headerBg
          )}
        >
          <span className="text-[10px] opacity-80">
            Đời {data.generation}
          </span>
          <span className="text-[10px]">
            {isMale ? "♂" : "♀"}
          </span>
          {data.birthOrder && (
            <span className="text-[10px] opacity-80">
              Thứ {data.birthOrder}
            </span>
          )}
        </div>

        {/* Avatar + Name Section */}
        <div className="flex items-center gap-2 p-2 flex-1">
          {/* Avatar */}
          <div
            className={cn(
              "rounded-full flex items-center justify-center font-bold shrink-0",
              avatarBg
            )}
            style={{
              width: 40 ,
              height: 40 ,
              fontSize: 14 ,
            }}
          >
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt={data.fullName}
                className="rounded-full object-cover"
                style={{
                  width: 40 ,
                  height: 40 ,
                }}
              />
            ) : (
              initials
            )}
          </div>

          {/* Name & Info */}
          <div className="min-w-0 flex-1">
            <p
              className="font-semibold truncate leading-tight"
              style={{ fontSize: 12  }}
            >
              {data.fullName}
            </p>
            {data.alias && (
              <p
                className="text-muted-foreground truncate italic"
                style={{ fontSize: 10  }}
              >
                ({data.alias})
              </p>
            )}
          </div>
        </div>

        {/* Birth/Death Years */}
        {getYears() && (
          <div className="px-2 pb-0.5 text-center">
            <p
              className="text-muted-foreground font-medium"
              style={{ fontSize: 11  }}
            >
              {getYears()}
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div
          className="px-2 pb-1.5 flex justify-between text-muted-foreground border-t pt-1 mx-2"
          style={{ fontSize: 10  }}
        >
          {data.spouseCount > 0 ? (
            <span>{data.spouseCount} vợ/chồng</span>
          ) : (
            <span />
          )}
          {data.childrenCount > 0 ? (
            <span>{data.childrenCount} con</span>
          ) : (
            <span />
          )}
        </div>

        {/* Gender Badge */}
        <div
          className={cn(
            "absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 font-medium text-white",
            isMale ? "bg-blue-500" : "bg-pink-500"
          )}
          style={{ fontSize: Math.max(8, 10 ) }}
        >
          {isMale ? "♂" : "♀"}
        </div>

        {/* Deceased indicator */}
        {!data.isLiving && (
          <div
            className="absolute -top-2 -left-2"
            style={{ fontSize: Math.max(10, 12 ) }}
          >
            🕊
          </div>
        )}
      </div>

      {/* Bottom handles (to children + spouse) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-400"
      />
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
