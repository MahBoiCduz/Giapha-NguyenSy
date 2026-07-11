import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, parentChildRelationships, marriages } from "@/lib/db/schema";
import { createMemberSchema, memberSearchSchema } from "@/lib/validations/member";
import { eq, like, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string }> }
) {
  try {
    const { clanId } = await params;
    const url = req.nextUrl;
    const searchParams = {
      search: url.searchParams.get("search") || undefined,
      generation: url.searchParams.get("generation") || undefined,
      gender: url.searchParams.get("gender") || undefined,
      living: url.searchParams.get("living") || undefined,
    };

    const filters = memberSearchSchema.safeParse(searchParams);

    // Build conditions
    const conditions = [eq(members.clanId, clanId)];

    if (filters.success && filters.data.search) {
      conditions.push(like(members.fullName, `%${filters.data.search}%`));
    }

    if (filters.success && filters.data.generation) {
      conditions.push(eq(members.generation, filters.data.generation));
    }

    if (filters.success && filters.data.gender) {
      conditions.push(eq(members.gender, filters.data.gender));
    }

    const result = await db
      .select()
      .from(members)
      .where(and(...conditions))
      .all();

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/clans/[clanId]/members error:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy danh sách thành viên" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string }> }
) {
  try {
    const { clanId } = await params;
    const body = await req.json();
    const parsed = createMemberSchema.safeParse({ ...body, clanId });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Compute fullName on server side
    const fullName = [
      parsed.data.familyName,
      parsed.data.middleName,
      parsed.data.givenName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    await db.insert(members).values({
      id,
      clanId,
      familyName: parsed.data.familyName,
      middleName: parsed.data.middleName || null,
      givenName: parsed.data.givenName,
      fullName,
      alias: parsed.data.alias || null,
      gender: parsed.data.gender,
      birthDate: parsed.data.birthDate || null,
      birthDateLunar: parsed.data.birthDateLunar || null,
      deathDate: parsed.data.deathDate || null,
      deathDateLunar: parsed.data.deathDateLunar || null,
      isLiving: parsed.data.isLiving ? 1 : 0,
      photoUrl: parsed.data.photoUrl || null,
      biography: parsed.data.biography || null,
      address: parsed.data.address || null,
      education: parsed.data.education || null,
      occupation: parsed.data.occupation || null,
      bloodType: parsed.data.bloodType || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      generation: parsed.data.generation,
      birthOrder: parsed.data.birthOrder || null,
      notes: parsed.data.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    // If parent specified, create relationship
    if (parsed.data.parentId) {
      await db.insert(parentChildRelationships).values({
        id: uuidv4(),
        clanId,
        parentId: parsed.data.parentId,
        childId: id,
        relationshipType: "biological",
        birthOrder: parsed.data.birthOrder || null,
      });
    }

    // If spouse specified, create marriage
    if (parsed.data.spouseId) {
      await db.insert(marriages).values({
        id: uuidv4(),
        clanId,
        partner1Id: parsed.data.spouseId,
        partner2Id: id,
        isActive: 1,
        createdAt: now,
      });
    }

    const member = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .get();

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("POST /api/clans/[clanId]/members error:", error);
    return NextResponse.json(
      { message: "Lỗi khi thêm thành viên" },
      { status: 500 }
    );
  }
}
