import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

// POST: OpenRouter provider'ına yeni modeller ekler
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

    // OpenRouter provider'ını bul - apiCode = 'openrouter' olan provider'ı ara
    const openRouterProvider = await prisma.provider.findFirst({
      where: {
        apiCode: 'openrouter'
      }
    });

    if (!openRouterProvider) {
      return NextResponse.json({ error: 'OpenRouter provider bulunamadı' }, { status: 404 });
    }

    // Eklenecek yeni modeller
    const newModels = [
      {
        name: 'LLama 4 Scout',
        details: 'Meta\'s Llama 4 Scout model, hosted on OpenRouter',
        codeName: 'meta-llama/llama-4-scout-17b-16e-instruct',
        providerId: openRouterProvider.id,
        userId: session.user.id,
        orderIndex: 1,
        isEnabled: true
      }
    ];

    // Modelleri kontrol et ve olmayanları ekle
    const results = [];

    for (const modelData of newModels) {
      // Model zaten var mı kontrol et
      const existingModel = await prisma.model.findFirst({
        where: {
          codeName: modelData.codeName,
          providerId: openRouterProvider.id
        }
      });

      if (existingModel) {
        results.push({
          name: modelData.name,
          status: 'skipped',
          message: 'Model zaten mevcut'
        });
        continue;
      }

      // Yeni model ekle
      const newModel = await prisma.model.create({
        data: modelData
      });

      results.push({
        name: modelData.name,
        status: 'added',
        message: 'Model başarıyla eklendi',
        model: newModel
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OpenRouter modelleri güncellendi',
      results
    });
  } catch (error) {
    console.error('Error setting up OpenRouter models:', error);
    return NextResponse.json(
      { error: 'OpenRouter modelleri eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
