import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Tüm modelleri getir
    const models = await prisma.model.findMany({
      include: {
        provider: true
      }
    });

    // Modelleri daha okunabilir bir formatta döndür
    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      apiCode: model.apiCode,
      providerId: model.providerId,
      providerName: model.provider?.name,
      providerApiKey: model.provider?.apiKey ? '***' : 'No API Key'
    }));

    return NextResponse.json(formattedModels);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
