import { prisma } from '@/lib/prisma';

/**
 * Veritabanından API anahtarını alır
 * @param providerName Provider adı (örn. "OpenRouter")
 * @returns API anahtarı veya null
 */
export async function getApiKeyFromDatabase(providerName: string): Promise<string | null> {
  try {
    // Tüm provider'ları getir ve logla
    const allProviders = await prisma.provider.findMany();
    console.log('Tüm provider\'lar:', allProviders.map(p => ({ id: p.id, name: p.name })));

    // Provider'ı bul
    const provider = await prisma.provider.findFirst({
      where: {
        name: providerName
      }
    });

    if (!provider) {
      console.error(`Provider "${providerName}" bulunamadı`);

      // Alternatif olarak, benzer isimleri kontrol et
      const similarProviders = allProviders.filter(p =>
        p.name.toLowerCase().includes(providerName.toLowerCase()) ||
        providerName.toLowerCase().includes(p.name.toLowerCase())
      );

      if (similarProviders.length > 0) {
        console.log(`Benzer isimli provider'lar bulundu:`, similarProviders.map(p => p.name));
        // İlk benzer provider'ı kullan
        console.log(`"${similarProviders[0].name}" provider'ı kullanılıyor`);
        return similarProviders[0].apiKey;
      }

      return null;
    }

    console.log(`${providerName} için API anahtarı bulundu`);
    return provider.apiKey;
  } catch (error) {
    console.error(`Veritabanından API anahtarı alınırken hata oluştu: ${error}`);
    return null;
  }
}

/**
 * API anahtarını alır, önce veritabanından, yoksa çevre değişkeninden
 * @param providerName Provider adı (örn. "OpenRouter")
 * @param envVarName Çevre değişkeni adı (örn. "OPENROUTER_API_KEY")
 * @returns API anahtarı veya null
 */
export async function getApiKey(providerName: string, envVarName: string): Promise<string | null> {
  console.log(`getApiKey çağrıldı: providerName=${providerName}, envVarName=${envVarName}`);

  // Önce veritabanından almayı dene
  const dbApiKey = await getApiKeyFromDatabase(providerName);
  if (dbApiKey) {
    console.log(`${providerName} için veritabanından API anahtarı alındı (ilk 4 karakter): ${dbApiKey.substring(0, 4)}...`);
    return dbApiKey;
  }

  // Veritabanında yoksa çevre değişkeninden al
  const envApiKey = process.env[envVarName];
  if (envApiKey) {
    console.log(`${providerName} için çevre değişkeninden API anahtarı alındı (ilk 4 karakter): ${envApiKey.substring(0, 4)}...`);
    return envApiKey;
  }

  console.log(`${providerName} için API anahtarı bulunamadı`);
  // Hiçbir yerden alınamadıysa null döndür
  return null;
}
