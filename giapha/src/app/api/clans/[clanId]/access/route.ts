import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clans } from "@/lib/db/schema";
import { verifyAccessCodeSchema } from "@/lib/validations/clan";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clanId: string }> }
) {
  try {
    const { clanId } = await params;
    const body = await req.json();
    const parsed = verifyAccessCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const clan = await db
      .select({ accessCodeHash: clans.accessCodeHash, isPublic: clans.isPublic })
      .from(clans)
      .where(eq(clans.id, clanId))
      .get();

    if (!clan) {
      return NextResponse.json(
        { message: "Không tìm thấy dòng họ" },
        { status: 404 }
      );
    }

    // If public, no code needed
    if (clan.isPublic === 1) {
      return NextResponse.json({ access: true, message: "Phả đồ công khai" });
    }

    // If no access code set, default to accessible
    if (!clan.accessCodeHash) {
      return NextResponse.json({ access: true, message: "Không yêu cầu mã bảo mật" });
    }

    // Verify code
    const isValid = await bcrypt.compare(
      parsed.data.code,
      clan.accessCodeHash
    );

    if (!isValid) {
      return NextResponse.json(
        { message: "Mã bảo mật không đúng" },
        { status: 403 }
      );
    }

    return NextResponse.json({ access: true, message: "Xác thực thành công" });
  } catch (error) {
    console.error("POST /api/clans/[clanId]/access error:", error);
    return NextResponse.json(
      { message: "Lỗi khi xác thực" },
      { status: 500 }
    );
  }
}
