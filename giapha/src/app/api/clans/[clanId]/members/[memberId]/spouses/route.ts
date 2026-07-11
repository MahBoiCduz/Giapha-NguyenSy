import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marriages, members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { clanId, memberId } = await params;
    const body = await req.json();
    const { spouseId, marriageDate } = body;

    if (!spouseId) {
      return NextResponse.json(
        { message: "Thiếu spouseId" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await db.insert(marriages).values({
      id: uuidv4(),
      clanId,
      partner1Id: memberId,
      partner2Id: spouseId,
      marriageDate: marriageDate || null,
      isActive: 1,
      createdAt: now,
    });

    return NextResponse.json({ message: "Đã thêm quan hệ hôn nhân" }, { status: 201 });
  } catch (error) {
    console.error("POST spouses error:", error);
    return NextResponse.json(
      { message: "Lỗi khi thêm quan hệ hôn nhân" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;

    const rels = await db
      .select()
      .from(marriages)
      .where(eq(marriages.partner1Id, memberId))
      .all();

    const rels2 = await db
      .select()
      .from(marriages)
      .where(eq(marriages.partner2Id, memberId))
      .all();

    return NextResponse.json([...rels, ...rels2]);
  } catch (error) {
    console.error("GET spouses error:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy danh sách hôn nhân" },
      { status: 500 }
    );
  }
}
