import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Sınav listesini döndürür
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Toplam sınav sayısını al
    const totalCount = await db.exam.count();
    const totalPages = Math.ceil(totalCount / limit);
    
    // Sınavları al
    const exams = await db.exam.findMany({
      skip,
      take: limit,
      orderBy: {
        created_at: 'desc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        created_at: true,
        updated_at: true,
        access_code: true,
        duration_minutes: true,
        _count: {
          select: {
            exam_results: true
          }
        }
      }
    });
    
    // Katılımcı sayılarını ekle
    const formattedExams = exams.map(exam => ({
      ...exam,
      participantCount: exam._count.exam_results,
      totalParticipants: 0, // Bu değer şu an için 0 olarak ayarlanacak
    }));
    
    return NextResponse.json({
      exams: formattedExams,
      totalPages,
      currentPage: page,
      totalCount
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Sınavlar yüklenirken bir hata oluştu' }, { status: 500 });
  }
}

// POST: Yeni sınav oluşturur
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, duration_minutes, access_code } = body;
    
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Sınav adı zorunludur' }, { status: 400 });
    }
    
    const newExam = await db.exam.create({
      data: {
        title,
        description: description || '',
        duration_minutes: duration_minutes || 60,
        access_code: access_code || generateExamCode(),
        status: 'draft',
      }
    });
    
    return NextResponse.json(newExam);
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json({ error: 'Sınav oluşturulurken bir hata oluştu' }, { status: 500 });
  }
}

// Rastgele erişim kodu oluşturma fonksiyonu
function generateExamCode(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return timestamp.slice(-6) + random;
} 