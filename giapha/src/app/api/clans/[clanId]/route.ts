import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clans } from "@/lib/db/schema";
import { updateClanSchema } from "@/lib/validations/clan";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clanId: string }> }
) {
  try {
    const { clanId } = await params;
    const clan = await db.select().from(clans).where(eq(clans.id, clanId)).get();

    if (!clan) {
      return NextResponse.json(
        { message: "Không tìm thấy dòng họ" },
        { status: 404 }
      );
    }

    return NextResponse.json(clan);
  } catch (error) {
    console.error("GET /api/clans/[clanId] error:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy thông tin dòng họ" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string }> }
) {
  try {
    const { clanId } = await params;
    const body = await req.json();
    const parsed = updateClanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(clans)
      .where(eq(clans.id, clanId))
      .get();

    if (!existing) {
      return NextResponse.json(
        { message: "Không tìm thấy dòng họ" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.origin !== undefined) updateData.origin = parsed.data.origin;
    if (parsed.data.isPublic !== undefined) {
      updateData.isPublic = parsed.data.isPublic ? 1 : 0;
    }
    if (parsed.data.accessCode) {
      const bcrypt = await import("bcryptjs");
      updateData.accessCodeHash = await bcrypt.hash(parsed.data.accessCode, 10);
    }

    await db.update(clans).set(updateData).where(eq(clans.id, clanId));

    const updated = await db
      .select()
      .from(clans)
      .where(eq(clans.id, clanId))
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/clans/[clanId] error:", error);
    return NextResponse.json(
      { message: "Lỗi khi cập nhật dòng họ" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clanId: string }> }
) {
  try {
    const { clanId } = await params;
    const existing = await db
      .select()
      .from(clans)
      .where(eq(clans.id, clanId))
      .get();

    if (!existing) {
      return NextResponse.json(
        { message: "Không tìm thấy dòng họ" },
        { status: 404 }
      );
    }

    await db.delete(clans).where(eq(clans.id, clanId));
    return NextResponse.json({ message: "Đã xóa dòng họ" });
  } catch (error) {
    console.error("DELETE /api/clans/[clanId] error:", error);
    return NextResponse.json(
      { message: "Lỗi khi xóa dòng họ" },
      { status: 500 }
    );
  }
}
