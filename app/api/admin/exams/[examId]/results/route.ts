import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Geçersiz sınav ID' }, { status: 400 });
    }

    // Sınavın mevcut olup olmadığını kontrol et
    const exam = await db.exam.findUnique({
      where: {
        id: examId
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
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

    // Ortalama puanı hesapla
    let averageScore = 0;
    if (results.length > 0) {
      const totalScore = results.reduce((sum: number, result: any) => sum + (result.score || 0), 0);
      averageScore = Math.round(totalScore / results.length);
    }

    return NextResponse.json({
      results,
      totalCount,
      totalPages,
      currentPage: page,
      averageScore
    });
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
    const examId = parseInt(params.examId);
    const { searchParams } = new URL(request.url);
    const resultId = parseInt(searchParams.get('resultId') || '0');

    if (isNaN(examId) || isNaN(resultId) || resultId === 0) {
      return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
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