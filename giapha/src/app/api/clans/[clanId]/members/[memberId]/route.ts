import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  members,
  parentChildRelationships,
  marriages,
} from "@/lib/db/schema";
import { updateMemberSchema } from "@/lib/validations/member";
import { eq, or } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { clanId, memberId } = await params;

    const member = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .get();

    if (!member || member.clanId !== clanId) {
      return NextResponse.json(
        { message: "Không tìm thấy thành viên" },
        { status: 404 }
      );
    }

    // Fetch related data
    const parentRels = await db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.childId, memberId))
      .all();

    const childRels = await db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.parentId, memberId))
      .all();

    const spouseRels = await db
      .select()
      .from(marriages)
      .where(
        or(
          eq(marriages.partner1Id, memberId),
          eq(marriages.partner2Id, memberId)
        )
      )
      .all();

    // Fetch related members
    const parentIds = parentRels.map((r) => r.parentId);
    const childIds = childRels.map((r) => r.childId);
    const spouseIds = spouseRels.map((r) =>
      r.partner1Id === memberId ? r.partner2Id : r.partner1Id
    );

    const parentMembers =
      parentIds.length > 0
        ? await db
            .select()
            .from(members)
            .where(/* sql */ or(...parentIds.map((id) => eq(members.id, id))))
            .all()
        : [];

    const childMembers =
      childIds.length > 0
        ? await db
            .select()
            .from(members)
            .where(or(...childIds.map((id) => eq(members.id, id))))
            .all()
        : [];

    const spouseMembers =
      spouseIds.length > 0
        ? await db
            .select()
            .from(members)
            .where(or(...spouseIds.map((id) => eq(members.id, id))))
            .all()
        : [];

    return NextResponse.json({
      ...member,
      parents: parentMembers,
      children: childMembers,
      spouses: spouseMembers,
      marriages: spouseRels,
    });
  } catch (error) {
    console.error("GET /api/clans/[clanId]/members/[memberId] error:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy thông tin thành viên" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { clanId, memberId } = await params;
    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .get();

    if (!existing || existing.clanId !== clanId) {
      return NextResponse.json(
        { message: "Không tìm thấy thành viên" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Rebuild fullName if name parts changed
    if (
      parsed.data.familyName !== undefined ||
      parsed.data.middleName !== undefined ||
      parsed.data.givenName !== undefined
    ) {
      const fn = parsed.data.familyName ?? existing.familyName;
      const mn = parsed.data.middleName ?? existing.middleName;
      const gn = parsed.data.givenName ?? existing.givenName;
      updateData.fullName = [fn, mn, gn].filter(Boolean).join(" ").trim();
    }

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        if (key === "isLiving") {
          updateData[key] = value ? 1 : 0;
        } else if (key !== "familyName" && key !== "middleName" && key !== "givenName") {
          updateData[key] = value;
        }
      }
    }

    // Also update the name parts
    if (parsed.data.familyName !== undefined) updateData.familyName = parsed.data.familyName;
    if (parsed.data.middleName !== undefined) updateData.middleName = parsed.data.middleName;
    if (parsed.data.givenName !== undefined) updateData.givenName = parsed.data.givenName;

    await db.update(members).set(updateData).where(eq(members.id, memberId));

    const updated = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/clans/[clanId]/members/[memberId] error:", error);
    return NextResponse.json(
      { message: "Lỗi khi cập nhật thành viên" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clanId: string; memberId: string }> }
) {
  try {
    const { clanId, memberId } = await params;

    const existing = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .get();

    if (!existing || existing.clanId !== clanId) {
      return NextResponse.json(
        { message: "Không tìm thấy thành viên" },
        { status: 404 }
      );
    }

    await db.delete(members).where(eq(members.id, memberId));
    return NextResponse.json({ message: "Đã xóa thành viên" });
  } catch (error) {
    console.error("DELETE /api/clans/[clanId]/members/[memberId] error:", error);
    return NextResponse.json(
      { message: "Lỗi khi xóa thành viên" },
      { status: 500 }
    );
  }
}
