import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';
import { ActivityType, EntityType, logActivity } from '@/lib/activity-logger';

// Sınav tipi
interface Exam {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  access_code: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  _count: {
    exam_results: number;
    questions: number;
  };
}

// GET: Sınav listesini döndürür
export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Kullanıcı bazlı filtreleme için where koşulu
    const whereCondition = {
      createdById: session.user.id
    };

    // Admin ve Superadmin kullanıcılar tüm sınavları görebilir
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN';
    const where = isAdmin ? {} : whereCondition;

    // Toplam sınav sayısını al
    const totalCount = await db.exam.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Sınavları al
    const exams = await db.exam.findMany({
      where,
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
        createdById: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            exam_results: true,
            questions: true
          }
        }
      }
    });

    // Katılımcı sayılarını ve soru sayılarını ekle
    const formattedExams = exams.map((exam: any) => ({
      ...exam,
      participantCount: exam._count.exam_results,
      totalParticipants: 0, // Bu değer şu an için 0 olarak ayarlanacak
      questionCount: exam._count.questions || 0, // Soru sayısını ekle
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
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, duration_minutes, access_code, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Sınav adı zorunludur' }, { status: 400 });
    }

    const newExam = await db.exam.create({
      data: {
        title,
        description: description || '',
        duration_minutes: duration_minutes || 60,
        access_code: access_code || generateExamCode(),
        status: status || 'draft',
        createdById: session.user.id, // Sınavı oluşturan kullanıcı
      }
    });

    // Aktivite kaydı oluştur
    try {
      await db.activity.create({
        data: {
          type: ActivityType.EXAM_CREATED,
          title: 'Yeni Sınav Oluşturuldu',
          description: `"${title}" sınavı oluşturuldu`,
          userId: session.user.id,
          entityId: newExam.id.toString(),
          entityType: EntityType.EXAM,
        }
      });
    } catch (activityError) {
      console.error('Error creating activity log:', activityError);
      // Aktivite kaydı oluşturma hatası sınav oluşturmayı etkilemeyecek
    }

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