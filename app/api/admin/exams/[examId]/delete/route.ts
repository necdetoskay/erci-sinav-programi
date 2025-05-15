import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
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

    // examId parametresini al ve doğrula
    const examId = parseInt(params.examId);
    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    console.log(`Sınav silme işlemi başlatılıyor: ID=${examId}`);

    // Sınavın mevcut olup olmadığını kontrol et
    const examExists = await db.exam.findUnique({
      where: { id: examId }
    });

    if (!examExists) {
      console.log(`ID=${examId} olan sınav bulunamadı`);
      return NextResponse.json({ message: "Sınav bulunamadı" }, { status: 404 });
    }

    console.log("Sınav bulundu:", {
      id: examExists.id,
      title: examExists.title
    });

    try {
      // Doğrudan sınavı sil - Prisma cascade delete özelliği ile ilişkili kayıtlar da silinecek
      console.log("Sınav siliniyor...");
      await db.exam.delete({
        where: { id: examId }
      });
      console.log("Sınav başarıyla silindi");

      return NextResponse.json({ success: true });
    } catch (deleteError) {
      console.error("Sınav silinirken hata:", deleteError);
      console.error("Hata detayları:", JSON.stringify(deleteError, null, 2));

      // Hatayı istemciye döndür
      return NextResponse.json({
        error: "Sınav silinirken bir hata oluştu",
        details: deleteError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
