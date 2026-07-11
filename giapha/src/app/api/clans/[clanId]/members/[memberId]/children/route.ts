import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parentChildRelationships, members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { clanId, memberId } = await params;
    const body = await req.json();
    const { childId, marriageId } = body;

    if (!childId) {
      return NextResponse.json(
        { message: "Thiếu childId" },
        { status: 400 }
      );
    }

    await db.insert(parentChildRelationships).values({
      id: uuidv4(),
      clanId,
      parentId: memberId,
      childId,
      marriageId: marriageId || null,
      relationshipType: "biological",
    });

    return NextResponse.json({ message: "Đã thêm quan hệ cha-con" }, { status: 201 });
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
