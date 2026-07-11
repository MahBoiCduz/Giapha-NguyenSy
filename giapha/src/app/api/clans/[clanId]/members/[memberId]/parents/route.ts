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
    const { parentId } = body;

    if (!parentId) {
      return NextResponse.json(
        { message: "Thiếu parentId" },
        { status: 400 }
      );
    }

    // Verify both members exist
    const [child, parent] = await Promise.all([
      db.select().from(members).where(eq(members.id, memberId)).get(),
      db.select().from(members).where(eq(members.id, parentId)).get(),
    ]);

    if (!child || !parent) {
      return NextResponse.json(
        { message: "Không tìm thấy thành viên" },
        { status: 404 }
      );
    }

    await db.insert(parentChildRelationships).values({
      id: uuidv4(),
      clanId,
      parentId,
      childId: memberId,
      relationshipType: "biological",
    });

    return NextResponse.json({ message: "Đã thêm quan hệ cha-con" }, { status: 201 });
  } catch (error) {
    console.error("POST parents error:", error);
    return NextResponse.json(
      { message: "Lỗi khi thêm quan hệ cha-con" },
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
      .where(eq(parentChildRelationships.childId, memberId))
      .all();

    return NextResponse.json(rels);
  } catch (error) {
    console.error("GET parents error:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy danh sách cha mẹ" },
      { status: 500 }
    );
  }
}
