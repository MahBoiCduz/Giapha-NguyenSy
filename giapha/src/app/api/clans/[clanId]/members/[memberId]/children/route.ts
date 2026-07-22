import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parentChildRelationships, marriages } from "@/lib/db/schema";
import { addChildSchema } from "@/lib/validations/member";
import { eq, and, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { clanId, memberId } = await params;
    const body = await req.json();
    const parsed = addChildSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { childId, marriageId } = parsed.data;

    // 1. Create primary parent-child relationship
    const primaryMarriageId = marriageId || null;
    await db.insert(parentChildRelationships).values({
      id: uuidv4(),
      clanId,
      parentId: memberId,
      childId,
      marriageId: primaryMarriageId,
      relationshipType: "biological",
    });

    // 2. Find spouse(s) and link child to them too
    const spouseMarriages = await db
      .select()
      .from(marriages)
      .where(
        and(
          eq(marriages.clanId, clanId),
          eq(marriages.isActive, 1),
          or(
            eq(marriages.partner1Id, memberId),
            eq(marriages.partner2Id, memberId)
          )
        )
      )
      .all();

    for (const marriage of spouseMarriages) {
      const spouseId =
        marriage.partner1Id === memberId
          ? marriage.partner2Id
          : marriage.partner1Id;

      // Skip if child already has a relationship with this spouse
      const existingRel = await db
        .select()
        .from(parentChildRelationships)
        .where(
          and(
            eq(parentChildRelationships.parentId, spouseId),
            eq(parentChildRelationships.childId, childId)
          )
        )
        .get();

      if (!existingRel) {
        // Use specified marriageId if it matches this spouse, otherwise use this marriage's id
        const relMarriageId =
          primaryMarriageId === marriage.id ? primaryMarriageId : marriage.id;

        await db.insert(parentChildRelationships).values({
          id: uuidv4(),
          clanId,
          parentId: spouseId,
          childId,
          marriageId: relMarriageId,
          relationshipType: "biological",
        });
      }
    }

    return NextResponse.json(
      { message: "Đã thêm quan hệ cha-con", linkedSpouses: spouseMarriages.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST children error:", error);
    return NextResponse.json(
      { message: "Lỗi khi thêm con" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { clanId, memberId } = await params;

    const rels = await db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.parentId, memberId))
      .all();

    return NextResponse.json(rels);
  } catch (error) {
    console.error("GET children error:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy danh sách con" },
      { status: 500 }
    );
  }
}
