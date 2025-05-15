import { NextResponse } from 'next/server'
import { getApiKey } from '@/lib/api-key-service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // URL'den model parametresini al (opsiyonel)
    const url = new URL(request.url);
    const model = url.searchParams.get('model') || '';

    // OpenRouter API'sini kullan (tüm modeller için)
    // Tüm provider'ları getir ve logla
    const allProviders = await prisma.provider.findMany();
    console.log('Tüm provider\'lar:', allProviders.map(p => ({ id: p.id, name: p.name })));

    // Sadece veritabanından API anahtarını al
    const providerName = 'Open Router';
    let apiKey = await getApiKey('Open Router', '');

    if (!apiKey) {
      console.error('OpenRouter API key missing in database')
      return NextResponse.json({
        status: 'error',
        message: 'OpenRouter API anahtarı veritabanında bulunamadı. Lütfen yönetici panelinden API anahtarını ekleyin.'
      });
    }

    // Test için kullanılacak model
    const testModel = model || 'anthropic/claude-3-sonnet:beta';

    console.log(`Sending request to ${providerName} with model ${testModel}...`);

    // API anahtarını ve diğer bilgileri logla
    console.log('API Key (ilk 10 karakter):', apiKey ? apiKey.substring(0, 10) + '...' : 'null');
    console.log('API Key Length:', apiKey ? apiKey.length : 0);
    console.log('Test Model:', testModel);
    console.log('Site URL:', process.env.SITE_URL || 'http://localhost:3000');

    // API anahtarının formatını kontrol et
    if (apiKey) {
      console.log('API anahtarı formatı kontrol ediliyor...');
      // Boşlukları temizle
      apiKey = apiKey.trim();

      // Eğer API anahtarı "Bearer " ile başlıyorsa, bu kısmı kaldır
      if (apiKey.startsWith('Bearer ')) {
        apiKey = apiKey.substring(7).trim();
        console.log('Bearer öneki kaldırıldı');
      }

      // API anahtarını olduğu gibi kullan, format düzeltmesi yapma
      console.log('API anahtarı formatı (ilk 10 karakter):', apiKey.substring(0, 10) + '...');
    }

    // API bağlantısını test et
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': 'Akilli Sinav Sistemi'
    };

    console.log('Request Headers:', JSON.stringify(headers, null, 2));

    // Model Llama 4 Maverick mi kontrol et
    // URL'den gelen model adını temizle (https:// gibi kısımları kaldır)
    let cleanedModelName = testModel;

    // URL formatını temizle
    if (cleanedModelName.includes('openrouter.ai/')) {
      // URL formatındaki model adını temizle
      const match = cleanedModelName.match(/openrouter\.ai\/(.+)/);
      if (match && match[1]) {
        cleanedModelName = match[1];
      }
    }

    console.log('Cleaned Model Name:', cleanedModelName);

    const isLlama4Maverick = cleanedModelName.toLowerCase().includes('maverick');

    // İstek gövdesini hazırla
    const requestBody: any = {
      model: cleanedModelName, // Temizlenmiş model adını kullan
      max_tokens: 50
    };

    // Llama 4 Maverick için özel format
    if (isLlama4Maverick) {
      console.log('Using Llama 4 Maverick format');
      requestBody.messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hello' }
          ]
        }
      ];
    } else {
      // Standart format
      requestBody.messages = [{ role: 'user', content: 'Hello' }];
    }

    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    // Zaman aşımı süresini artır (30 saniye)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye

    let response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', error);

      // AbortError (zaman aşımı) hatası için özel mesaj
      if (error instanceof DOMException && error.name === 'AbortError') {
        return new NextResponse(
          JSON.stringify({
            status: 'error',
            message: `${providerName} API yanıt vermedi (zaman aşımı). Lütfen daha sonra tekrar deneyin.`
          }),
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            }
          }
        );
      }

      throw error;
    }

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const responseText = await response.text()
      console.error(`${providerName} Error Response:`, responseText)

      try {
        const error = JSON.parse(responseText)
        throw new Error(error.error?.message || `${providerName} API yanıt vermedi`)
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        throw new Error(`API yanıtı işlenemedi: ${responseText.substring(0, 100)}...`)
      }
    }

    const responseText = await response.text()
    console.log('Response text:', responseText)

    try {
      const data = JSON.parse(responseText)

      // OpenRouter API hata kontrolü
      if (data?.error) {
        console.log('OpenRouter Error Response:', data.error);

        // Kota sınırı hatası (429) kontrolü
        if (data.error.code === 429) {
          return new NextResponse(
            JSON.stringify({
              status: 'error',
              message: `${providerName} kullanım kotası aşıldı. Lütfen farklı bir model deneyin veya planınızı kontrol edin.`
            }),
            {
              headers: {
                'Content-Type': 'application/json; charset=utf-8'
              }
            }
          )
        }

        // Diğer hatalar için
        return new NextResponse(
          JSON.stringify({
            status: 'error',
            message: data.error.message || `${providerName} servisi yanıt vermedi`
          }),
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            }
          }
        )
      }

      // OpenRouter API yanıt formatı
      const text = data.choices?.[0]?.message?.content;

      if (text) {
        return new NextResponse(
          JSON.stringify({
            status: 'ready',
            provider: providerName
          }),
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            }
          }
        )
      } else {
        return new NextResponse(
          JSON.stringify({
            status: 'error',
            message: `${providerName} servisi yanıt vermedi`
          }),
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            }
          }
        )
      }
    } catch (parseError) {
      console.error('Error parsing successful response:', parseError)
      throw new Error(`Başarılı yanıt işlenemedi: ${responseText.substring(0, 100)}...`)
    }
  } catch (error) {
    console.error('LLM Status Check Error:', error)
    return new NextResponse(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Bilinmeyen bir hata olustu'
      }),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    )
  }
}
