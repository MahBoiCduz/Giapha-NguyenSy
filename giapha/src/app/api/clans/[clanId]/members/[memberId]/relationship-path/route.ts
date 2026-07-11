import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parentChildRelationships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { findRelationshipPath } from "@/lib/utils/relationship";
import type { MemberNode } from "@/lib/utils/relationship";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { clanId, memberId } = await params;
    const targetId = req.nextUrl.searchParams.get("targetId");

    if (!targetId) {
      return NextResponse.json(
        { message: "Thiếu targetId" },
        { status: 400 }
      );
    }

    // Fetch all relationships in the clan
    const relationships = await db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.clanId, clanId))
      .all();

    // Fetch all members in the clan (needed for relationship calculation)
    const { members: membersTable } = await import("@/lib/db/schema");
    const allMembers = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.clanId, clanId))
      .all();

    const memberMap = new Map<string, MemberNode>();
    for (const m of allMembers) {
      memberMap.set(m.id, {
        id: m.id,
        fullName: m.fullName,
        gender: m.gender as "male" | "female",
        generation: m.generation ?? 1,
      });
    }

    const path = findRelationshipPath(
      memberMap,
      relationships.map((r) => ({
        parentId: r.parentId,
        childId: r.childId,
        type: "parent-child" as const,
      })),
      memberId,
      targetId
    );

    if (!path) {
      return NextResponse.json(
        { message: "Không tìm thấy đường dẫn quan hệ" },
        { status: 404 }
      );
    }

    return NextResponse.json({ path });
  } catch (error) {
    console.error("GET relationship-path error:", error);
    return NextResponse.json(
      { message: "Lỗi khi tìm đường dẫn quan hệ" },
      { status: 500 }
    );
  }
}
