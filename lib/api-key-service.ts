import { prisma } from '@/lib/prisma';

/**
 * Veritabanından API anahtarını alır
 * @param providerName Provider adı (örn. "OpenRouter")
 * @param apiCode API kodu (opsiyonel, belirtilirse bu koda sahip provider aranır)
 * @returns API anahtarı veya null
 */
export async function getApiKeyFromDatabase(providerName: string, apiCode?: string): Promise<string | null> {
  try {
    // Tüm provider'ları getir ve logla
    const allProviders = await prisma.provider.findMany();
    console.log('Tüm provider\'lar:', allProviders.map(p => ({ id: p.id, name: p.name })));

    // Provider'ı tam olarak girilen isimle bul
    // Eğer apiCode belirtilmişse, bu koda sahip provider'ı ara
    const whereClause = apiCode
      ? {
          name: providerName,
          apiCode: apiCode
        }
      : {
          name: providerName
        };

    const provider = await prisma.provider.findFirst({
      where: whereClause
    });

    // Eğer tam eşleşme bulunamazsa, büyük-küçük harf duyarsız olarak ara
    if (!provider) {
      console.log(`Tam eşleşme bulunamadı, büyük-küçük harf duyarsız arama yapılıyor...`);

      // Büyük-küçük harf duyarsız arama için where koşulu
      const caseInsensitiveWhereClause = apiCode
        ? {
            name: {
              equals: providerName,
              mode: 'insensitive'
            },
            apiCode: apiCode
          }
        : {
            name: {
              equals: providerName,
              mode: 'insensitive'
            }
          };

      const caseInsensitiveProvider = await prisma.provider.findFirst({
        where: caseInsensitiveWhereClause
      });

      if (caseInsensitiveProvider) {
        console.log(`Büyük-küçük harf duyarsız eşleşme bulundu: ${caseInsensitiveProvider.name}`);
        return caseInsensitiveProvider.apiKey;
      }
    }

    if (!provider) {
      console.error(`Provider "${providerName}" bulunamadı`);

      // Alternatif olarak, benzer isimleri kontrol et
      let similarProviders = allProviders.filter(p =>
        p.name.toLowerCase().includes(providerName.toLowerCase()) ||
        providerName.toLowerCase().includes(p.name.toLowerCase())
      );

      // Eğer apiCode belirtilmişse, bu koda sahip provider'ları filtrele
      if (apiCode && similarProviders.length > 0) {
        const codeFilteredProviders = similarProviders.filter(p => p.apiCode === apiCode);
        // Eğer apiCode ile eşleşen provider varsa, sadece onları kullan
        if (codeFilteredProviders.length > 0) {
          similarProviders = codeFilteredProviders;
        }
      }

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
 * API anahtarını sadece veritabanından alır
 * @param providerName Provider adı (örn. "OpenRouter")
 * @param envVarName Kullanılmıyor (geriye dönük uyumluluk için)
 * @param apiCode API kodu (opsiyonel, belirtilirse bu koda sahip provider aranır)
 * @returns API anahtarı veya null
 */
export async function getApiKey(providerName: string, envVarName: string, apiCode?: string): Promise<string | null> {
  console.log(`getApiKey çağrıldı: providerName=${providerName}, apiCode=${apiCode || 'belirtilmedi'}`);

  // Sadece veritabanından almayı dene
  const dbApiKey = await getApiKeyFromDatabase(providerName, apiCode);
  if (dbApiKey) {
    // API anahtarını temizle (boşlukları kaldır)
    const cleanedApiKey = dbApiKey.trim();

    // Eğer API anahtarı "Bearer " ile başlıyorsa, bu kısmı kaldır
    let finalApiKey = cleanedApiKey;
    if (finalApiKey.startsWith('Bearer ')) {
      finalApiKey = finalApiKey.substring(7).trim();
      console.log(`${providerName} için Bearer öneki kaldırıldı`);
    }

    console.log(`${providerName} için veritabanından API anahtarı alındı (ilk 4 karakter): ${finalApiKey.substring(0, 4)}...`);
    return finalApiKey;
  }

  console.log(`${providerName} için veritabanında API anahtarı bulunamadı`);
  // Bulunamadıysa null döndür
  return null;
}
