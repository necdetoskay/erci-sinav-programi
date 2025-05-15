import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET: Sınavın sorularını listeler
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getSession(request);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });
    }

    // Kullanıcı bazlı erişim kontrolü
    const whereCondition = {
      id: examId
    };

    // Admin kullanıcıları sadece kendi oluşturdukları sınavlara erişebilir
    // Superadmin tüm sınavlara erişebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['createdById'] = session.user.id;
    }

    // Sınavın mevcut olup olmadığını ve kullanıcının erişim izni olup olmadığını kontrol et
    const exam = await prisma.exam.findFirst({
      where: whereCondition
    });

    if (!exam) {
      return NextResponse.json({ error: 'Sınav bulunamadı veya erişim izniniz yok' }, { status: 404 });
    }

    // Sınav ID'ye göre soruları getir
    const questions = await prisma.question.findMany({
      where: { exam_id: examId },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST: Sınava yeni sorular ekler veya mevcut soruları günceller
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getSession(request);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Invalid exam ID' }, { status: 400 });
    }

    // Kullanıcı bazlı erişim kontrolü
    const whereCondition = {
      id: examId
    };

    // Admin kullanıcıları sadece kendi oluşturdukları sınavlara erişebilir
    // Superadmin tüm sınavlara erişebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['createdById'] = session.user.id;
    }

    // Sınavın mevcut olup olmadığını ve kullanıcının erişim izni olup olmadığını kontrol et
    const exam = await prisma.exam.findFirst({
      where: whereCondition
    });

    if (!exam) {
      return NextResponse.json({ error: 'Sınav bulunamadı veya erişim izniniz yok' }, { status: 404 });
    }

    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Questions are required and must be an array' },
        { status: 400 }
      );
    }

    // Mevcut soruları sil ve yeniden oluştur (transactional)
    const result = await prisma.$transaction(async (tx: any) => {
      // Mevcut soruları sil
      await tx.question.deleteMany({
        where: { exam_id: examId },
      });

      // Yeni soruları ekle
      const createdQuestions = await Promise.all(
        questions.map(async (q, index) => {
          const { id, options, ...questionData } = q;

          return tx.question.create({
            data: {
              ...questionData,
              exam_id: examId,
              position: index + 1,
              options: Array.isArray(options)
                ? options.map((o: string | { text: string; id: string }) =>
                    typeof o === 'string' ? o : o.text
                  )
                : [],
            },
          });
        })
      );

      return createdQuestions;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json(
      { error: 'Failed to save questions' },
      { status: 500 }
    );
  }
}