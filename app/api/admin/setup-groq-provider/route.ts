import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

// POST: Groq provider'ı oluşturur veya günceller
export async function POST(request: Request) {
  try {
    // Oturum kontrolü
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece SUPERADMIN ve ADMIN rollerine izin ver
    if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Request body'den API anahtarını al
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API anahtarı gereklidir' }, { status: 400 });
    }

    // Groq provider'ı var mı kontrol et
    const existingProvider = await prisma.provider.findFirst({
      where: {
        name: 'Groq'
      }
    });

    let provider;

    if (existingProvider) {
      // Varsa güncelle
      provider = await prisma.provider.update({
        where: {
          id: existingProvider.id
        },
        data: {
          apiKey
        }
      });
    } else {
      // Yoksa oluştur
      provider = await prisma.provider.create({
        data: {
          name: 'Groq',
          description: 'Groq API Provider',
          apiKey,
          apiCode: 'groq',
          userId: session.user.id
        }
      });

      // Groq modellerini oluştur
      await prisma.model.createMany({
        data: [
          {
            name: 'Llama 3 8B',
            details: 'Llama 3 8B model by Meta, hosted on Groq',
            codeName: 'llama3-8b-8192',
            providerId: provider.id,
            userId: session.user.id,
            orderIndex: 1,
            isEnabled: true
          },
          {
            name: 'Llama 3 70B',
            details: 'Llama 3 70B model by Meta, hosted on Groq',
            codeName: 'llama3-70b-8192',
            providerId: provider.id,
            userId: session.user.id,
            orderIndex: 2,
            isEnabled: true
          },
          {
            name: 'Mixtral 8x7B',
            details: 'Mixtral 8x7B model by Mistral AI, hosted on Groq',
            codeName: 'mixtral-8x7b-32768',
            providerId: provider.id,
            userId: session.user.id,
            orderIndex: 3,
            isEnabled: true
          }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: existingProvider ? 'Groq provider güncellendi' : 'Groq provider oluşturuldu',
      provider
    });
  } catch (error) {
    console.error('Error setting up Groq provider:', error);
    return NextResponse.json(
      { error: 'Groq provider oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
