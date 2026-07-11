import { NextRequest, NextResponse } from "next/server";
import { db, users, accounts } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .get();

    if (existing) {
      return NextResponse.json(
        { message: "Email này đã được đăng ký" },
        { status: 409 }
      );
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await db.insert(users).values({
      id: userId,
      name: name || email.split("@")[0],
      email: normalizedEmail,
    });

    // Store password hash in accounts table (using credentials provider slot)
    await db.insert(accounts).values({
      userId,
      type: "credentials",
      provider: "credentials",
      providerAccountId: userId,
      refresh_token: hashedPassword, // password hash stored here
    });

    // Create the clan_editors entry is NOT needed at registration
    // It's created when the user creates or is invited to a clan

    return NextResponse.json(
      { message: "Đăng ký thành công", userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Lỗi khi đăng ký. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
