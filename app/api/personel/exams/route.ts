import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Personel rolüne sahip kullanıcının atanmış sınavlarını getir
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü
    if (session.user.role !== "PERSONEL") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Şimdilik tüm yayındaki sınavları getir
    // İlerleyen aşamalarda personele özel sınav atama sistemi eklenebilir
    const exams = await prisma.exam.findMany({
      where: {
        status: "active", // Sadece yayındaki (active) sınavları getir
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        duration_minutes: true,
        access_code: true,
      },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching personel exams:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
