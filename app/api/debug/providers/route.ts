import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Tüm provider'ları getir
    const providers = await prisma.provider.findMany({
      include: {
        models: true
      }
    });

    // API anahtarlarını maskele
    const maskedProviders = providers.map(provider => {
      const apiKey = provider.apiKey;
      let maskedKey = apiKey;

      if (apiKey && apiKey.length > 8) {
        const firstFour = apiKey.substring(0, 4);
        const lastFour = apiKey.substring(apiKey.length - 4);
        const middleMask = '•'.repeat(apiKey.length - 8);
        maskedKey = `${firstFour}${middleMask}${lastFour}`;
      } else if (apiKey) {
        maskedKey = '••••••••';
      }

      return {
        ...provider,
        apiKey: maskedKey
      };
    });

    return NextResponse.json(maskedProviders);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}
