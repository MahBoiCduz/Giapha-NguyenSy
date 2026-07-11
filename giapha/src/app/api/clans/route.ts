import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clans } from "@/lib/db/schema";
import { createClanSchema } from "@/lib/validations/clan";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const allClans = await db.select().from(clans).all();
    return NextResponse.json(allClans);
  } catch (error) {
    console.error("GET /api/clans error:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy danh sách dòng họ" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createClanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dữ liệu không hợp lệ", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.insert(clans).values({
      id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      origin: parsed.data.origin || null,
      isPublic: parsed.data.isPublic ? 1 : 0,
      accessCodeHash: parsed.data.accessCode
        ? await hashAccessCode(parsed.data.accessCode)
        : null,
      createdAt: now,
      updatedAt: now,
    });

    const clan = await db.select().from(clans).where(eq(clans.id, id)).get();
    return NextResponse.json(clan, { status: 201 });
  } catch (error) {
    console.error("POST /api/clans error:", error);
    return NextResponse.json(
      { message: "Lỗi khi tạo dòng họ" },
      { status: 500 }
    );
  }
}

async function hashAccessCode(code: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(code, 10);
}
