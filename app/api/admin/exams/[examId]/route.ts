import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET: Belirli bir sınavın detaylarını döndürür
export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Geçersiz sınav ID' }, { status: 400 });
    }

    const exam = await db.exam.findUnique({
      where: {
        id: examId
      },
      include: {
        questions: {
          orderBy: {
            position: 'asc'
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
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Geçersiz sınav ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, duration_minutes, access_code, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Sınav adı zorunludur' }, { status: 400 });
    }

    // Sınavın mevcut olup olmadığını kontrol et
    const existingExam = await db.exam.findUnique({
      where: {
        id: examId
      }
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
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json({ error: 'Geçersiz sınav ID' }, { status: 400 });
    }

    // Sınavın mevcut olup olmadığını kontrol et
    const existingExam = await db.exam.findUnique({
      where: {
        id: examId
      }
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Sınav bulunamadı' }, { status: 404 });
    }

    // Cascade delete ile sorular ve sonuçlar da silinecek
    await db.exam.delete({
      where: {
        id: examId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json({ error: 'Sınav silinirken bir hata oluştu' }, { status: 500 });
  }
}