import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clans, members, marriages, parentChildRelationships } from "@/lib/db/schema";
import { treeQuerySchema } from "@/lib/validations/member";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string }> }
) {
  try {
    const { clanId } = await params;
    const url = req.nextUrl;
    const query = treeQuerySchema.safeParse({
      rootId: url.searchParams.get("rootId") || undefined,
      generations: url.searchParams.get("generations") || "5",
      direction: url.searchParams.get("direction") || "down",
    });

    const maxGenerations = query.success ? query.data.generations : 5;
    let rootId = query.success ? query.data.rootId : undefined;

    // Fetch clan info
    const clan = await db
      .select({ id: clans.id, name: clans.name })
      .from(clans)
      .where(eq(clans.id, clanId))
      .get();

    if (!clan) {
      return NextResponse.json(
        { message: "Không tìm thấy dòng họ" },
        { status: 404 }
      );
    }

    // Fetch all members in this clan
    const allMembers = await db
      .select()
      .from(members)
      .where(eq(members.clanId, clanId))
      .all();

    if (allMembers.length === 0) {
      return NextResponse.json({
        clan,
        members: [],
        marriages: [],
        relationships: [],
      });
    }

    // Fetch all relationships to determine root
    const allRelationships = await db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.clanId, clanId))
      .all();

    // Auto-detect root if not specified: member with children but no parents, lowest generation
    if (!rootId) {
      const childIds = new Set(allRelationships.map((r) => r.childId));
      const parentIds = new Set(allRelationships.map((r) => r.parentId));

      // Candidates: members who are parents but not children (top of tree)
      const rootCandidates = allMembers.filter(
        (m) => parentIds.has(m.id) && !childIds.has(m.id)
      );

      if (rootCandidates.length > 0) {
        // Pick the one with the lowest generation (oldest ancestor)
        rootCandidates.sort((a, b) => (a.generation ?? 999) - (b.generation ?? 999));
        rootId = rootCandidates[0].id;
      } else {
        // Fallback: member with lowest generation
        const sorted = [...allMembers].sort(
          (a, b) => (a.generation ?? 999) - (b.generation ?? 999)
        );
        rootId = sorted[0]?.id;
      }
    }

    if (!rootId) {
      return NextResponse.json({
        clan,
        members: allMembers.map((m) => ({ ...m, spouseCount: 0, childrenCount: 0 })),
        marriages: [],
        relationships: [],
      });
    }

    // Determine generation range from root
    const root = allMembers.find((m) => m.id === rootId);
    const minGen = root?.generation ?? 1;
    const maxGen = minGen + maxGenerations - 1;

    // Filter members within generation range
    const filteredMembers = allMembers.filter(
      (m) => (m.generation ?? 1) >= minGen && (m.generation ?? 1) <= maxGen
    );

    const memberIds = new Set(filteredMembers.map((m) => m.id));

    // Fetch marriages
    const allMarriages = await db
      .select()
      .from(marriages)
      .where(eq(marriages.clanId, clanId))
      .all();

    // Filter marriages: both partners in member set
    const filteredMarriages = allMarriages.filter(
      (m) => memberIds.has(m.partner1Id) && memberIds.has(m.partner2Id)
    );

    // Filter relationships
    const filteredRelationships = allRelationships.filter(
      (r) => memberIds.has(r.parentId) && memberIds.has(r.childId)
    );

    // Count spouses and children per member
    const spouseCounts = new Map<string, number>();
    for (const m of filteredMarriages) {
      spouseCounts.set(m.partner1Id, (spouseCounts.get(m.partner1Id) || 0) + 1);
      spouseCounts.set(m.partner2Id, (spouseCounts.get(m.partner2Id) || 0) + 1);
    }

    const childCounts = new Map<string, number>();
    for (const r of filteredRelationships) {
      childCounts.set(r.parentId, (childCounts.get(r.parentId) || 0) + 1);
    }

    const enrichedMembers = filteredMembers.map((m) => ({
      ...m,
      spouseCount: spouseCounts.get(m.id) || 0,
      childrenCount: childCounts.get(m.id) || 0,
    }));

    return NextResponse.json({
      clan,
      members: enrichedMembers,
      marriages: filteredMarriages,
      relationships: filteredRelationships,
    });
  } catch (error) {
    console.error("GET /api/clans/[clanId]/tree error:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy dữ liệu phả đồ" },
      { status: 500 }
    );
  }
}
