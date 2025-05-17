import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

// Sonuç tipi
interface ExamResult {
  id: number;
  exam_id: number;
  participant_name: string;
  participant_email: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  created_at: Date;
}

// GET: Sınavın sonuçlarını listeler
export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Geçersiz sınav ID' }, { status: 400 });
    }

    // Sınavın mevcut olup olmadığını kontrol et ve kullanıcı erişimini doğrula
    const whereCondition = {
      id: examId
    };

    // Admin kullanıcıları sadece kendi oluşturdukları sınavlara erişebilir
    // Superadmin tüm sınavlara erişebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['createdById'] = session.user.id;
    }

    const exam = await db.exam.findFirst({
      where: whereCondition
    });

    if (!exam) {
      return NextResponse.json({ error: 'Sınav bulunamadı veya erişim izniniz yok' }, { status: 404 });
    }

    // Sayfalama parametrelerini al
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Sonuçları say
    const totalCount = await db.examResult.count({
      where: {
        exam_id: examId
      }
    });

    const totalPages = Math.ceil(totalCount / limit);

    try {
      // Sonuçları getir
      const results = await db.examResult.findMany({
        where: {
          exam_id: examId
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      });

      // Sonuçları doğrula ve null değerleri işle
      const validResults = results.map(result => ({
        ...result,
        score: result.score === null ? 0 : result.score,
        total_questions: result.total_questions === null ? 0 : result.total_questions,
        participant_email: result.participant_email === null ? '' : result.participant_email,
        start_time: result.start_time || null,
        end_time: result.end_time || null
      }));

      // Ortalama puanı hesapla
      let averageScore = 0;
      if (validResults.length > 0) {
        const totalScore = validResults.reduce((sum, result) => sum + (result.score || 0), 0);
        averageScore = Math.round(totalScore / validResults.length);
      }

      return NextResponse.json({
        results: validResults,
        totalCount,
        totalPages,
        currentPage: page,
        averageScore
      });
    } catch (dbError) {
      console.error('Database error fetching exam results:', dbError);
      return NextResponse.json({ error: 'Veritabanından sonuçlar alınırken bir hata oluştu' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json({ error: 'Sınav sonuçları yüklenirken bir hata oluştu' }, { status: 500 });
  }
}

// DELETE: Belirli bir sınav sonucunu siler
export async function DELETE(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const { searchParams } = new URL(request.url);
    const resultId = parseInt(searchParams.get('resultId') || '0');

    if (isNaN(examId) || isNaN(resultId) || resultId === 0) {
      return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
    }

    // Sınavın kullanıcıya ait olup olmadığını kontrol et
    const whereCondition = {
      id: examId
    };

    // Admin kullanıcıları sadece kendi oluşturdukları sınavlara erişebilir
    // Superadmin tüm sınavlara erişebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['createdById'] = session.user.id;
    }

    const exam = await db.exam.findFirst({
      where: whereCondition
    });

    if (!exam) {
      return NextResponse.json({ error: 'Sınav bulunamadı veya erişim izniniz yok' }, { status: 404 });
    }

    // Sonucun bu sınava ait olup olmadığını kontrol et
    const result = await db.examResult.findUnique({
      where: {
        id: resultId
      }
    });

    if (!result || result.exam_id !== examId) {
      return NextResponse.json({ error: 'Sonuç bulunamadı' }, { status: 404 });
    }

    // Sonucu sil
    await db.examResult.delete({
      where: {
        id: resultId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam result:', error);
    return NextResponse.json({ error: 'Sonuç silinirken bir hata oluştu' }, { status: 500 });
  }
}