import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

// GET: Belirli bir sınavın detaylarını döndürür
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Geçersiz sınav ID' }, { status: 400 });
    }

    // Kullanıcı bazlı erişim kontrolü
    const whereCondition = {
      id: examId
    };

    // Admin kullanıcıları sadece kendi oluşturdukları sınavları görebilir
    // Superadmin tüm sınavlara erişebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['createdById'] = session.user.id;
    }

    const exam = await db.exam.findFirst({
      where: whereCondition,
      include: {
        questions: {
          orderBy: {
            position: 'asc'
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            exam_results: true
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    // Sınav verisini düzenle
    const formattedExam = {
      ...exam,
      participantCount: exam._count.exam_results,
      totalParticipants: 0, // Bu değer şu an için 0 olarak ayarlanacak
    };

    return NextResponse.json(formattedExam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json({ error: 'Sınav yüklenirken bir hata oluştu' }, { status: 500 });
  }
}

// PUT: Belirli bir sınavı günceller
export async function PUT(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Geçersiz sınav ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, duration_minutes, access_code, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Sınav adı zorunludur' }, { status: 400 });
    }

    // Kullanıcı bazlı erişim kontrolü
    const whereCondition = {
      id: examId
    };

    // Admin kullanıcıları sadece kendi oluşturdukları sınavları güncelleyebilir
    // Superadmin tüm sınavları güncelleyebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['createdById'] = session.user.id;
    }

    // Sınavın mevcut olup olmadığını kontrol et
    const existingExam = await db.exam.findFirst({
      where: whereCondition
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    // Sınavı güncelle
    const updatedExam = await db.exam.update({
      where: {
        id: examId
      },
      data: {
        title,
        description: description || '',
        duration_minutes: duration_minutes || existingExam.duration_minutes,
        access_code: access_code || existingExam.access_code,
        status: status || existingExam.status,
      }
    });

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error('Error updating exam:', error);
    return NextResponse.json({ error: 'Sınav güncellenirken bir hata oluştu' }, { status: 500 });
  }
}

// DELETE: Belirli bir sınavı siler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Geçersiz sınav ID' }, { status: 400 });
    }

    // Kullanıcı bazlı erişim kontrolü
    const whereCondition = {
      id: examId
    };

    // Admin kullanıcıları sadece kendi oluşturdukları sınavları silebilir
    // Superadmin tüm sınavları silebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['createdById'] = session.user.id;
    }

    // Sınavın mevcut olup olmadığını kontrol et
    const existingExam = await db.exam.findFirst({
      where: whereCondition
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    // İlişkili kayıtları manuel olarak sil
    console.log(`Sınav siliniyor: ID=${examId}`);

    try {
      // Sınavın mevcut olup olmadığını kontrol et
      const examExists = await db.exam.findUnique({
        where: { id: examId },
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
              results: true
            }
          }
        }
      });

      if (!examExists) {
        console.log(`ID=${examId} olan sınav bulunamadı`);
        return NextResponse.json({ message: "Sınav bulunamadı" }, { status: 404 });
      }

      console.log("Sınav bulundu:", {
        id: examExists.id,
        title: examExists.title,
        questionCount: examExists._count.questions,
        attemptCount: examExists._count.attempts,
        resultCount: examExists._count.results
      });

      // 1. Önce sınav denemelerini sil
      console.log("Sınav denemeleri siliniyor...");
      const deleteAttempts = await db.examAttempt.deleteMany({
        where: { examId: examId }
      });
      console.log(`${deleteAttempts.count} sınav denemesi silindi`);

      // 2. Sınav sonuçlarını sil
      console.log("Sınav sonuçları siliniyor...");
      const deleteResults = await db.examResult.deleteMany({
        where: { examId: examId }
      });
      console.log(`${deleteResults.count} sınav sonucu silindi`);

      // 3. Sınav sorularını sil
      console.log("Sınav soruları siliniyor...");
      const deleteQuestions = await db.examQuestion.deleteMany({
        where: { examId: examId }
      });
      console.log(`${deleteQuestions.count} sınav sorusu silindi`);

      // 4. Son olarak sınavı sil
      console.log("Sınav siliniyor...");
      await db.exam.delete({
        where: { id: examId }
      });
      console.log("Sınav başarıyla silindi");
    } catch (deleteError) {
      console.error("Sınav silinirken hata:", deleteError);
      console.error("Hata detayları:", JSON.stringify(deleteError, null, 2));

      // Hatayı istemciye döndür
      return NextResponse.json({
        error: "Sınav silinirken bir hata oluştu",
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ error: 'Sınav silinirken bir hata oluştu' }, { status: 500 });
  }
}