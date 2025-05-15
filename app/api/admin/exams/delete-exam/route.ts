import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Oturum kontrolü
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sadece ADMIN ve SUPERADMIN rollerine izin ver
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // URL'den sınav ID'sini al
    const url = new URL(request.url);
    const examId = parseInt(url.searchParams.get("id") || "");

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    console.log(`Sınav silme işlemi başlatılıyor: ID=${examId}`);

    try {
      // Doğrudan sınavı sil
      await db.exam.delete({
        where: { id: examId }
      });

      console.log(`Sınav başarıyla silindi: ID=${examId}`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Sınav silinirken hata:", error);

      // Başarısız oldu, sadece başarısız mesajı döndür
      console.error("Sınav silinirken hata oluştu, lütfen manuel olarak silin");
      return NextResponse.json(
        { error: "Sınav silinirken bir hata oluştu, lütfen manuel olarak silin" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Sınav silme API hatası:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
