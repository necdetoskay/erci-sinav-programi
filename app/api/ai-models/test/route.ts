import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// API şablonunu analiz et ve HTTP istek yapısına dönüştür
function parseApiTemplate(template: string, apiKey: string, prompt: string, modelId: string): {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any
} {
  // Varsayılan değerler
  let config = {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://kentkonut.com.tr',
          'X-Title': 'Kent Konut Sinav Portali'
      },
      body: {
          model: 'meta-llama/llama-4-maverick:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 100
      }
  };

  try {
      // Template JSON formatında mı?
      if (template.trim().startsWith('{')) {
          try {
              const templateObj = JSON.parse(template);

              // URL, method, headers ve body'yi ayarla
              if (templateObj.url) config.url = templateObj.url;
              if (templateObj.method) config.method = templateObj.method;
              if (templateObj.headers) config.headers = { ...config.headers, ...templateObj.headers };

              // Endpoint özel alanı
              if (templateObj.endpoint) {
                  config.url = templateObj.endpoint;
                  delete templateObj.endpoint;
              }

              // Headers özel alanı
              if (templateObj.headers) {
                  delete templateObj.headers; // Zaten config.headers'a ekledik
              }

              // URL ve method dışındaki tüm alanları body'ye ekle
              config.body = {};
              for (const key in templateObj) {
                  if (!['url', 'method', 'endpoint', 'headers'].includes(key)) {
                      config.body[key] = templateObj[key];
                  }
              }

              // Body boşsa varsayılan body'yi kullan
              if (Object.keys(config.body).length === 0) {
                  config.body = {
                      model: 'meta-llama/llama-4-maverick:free',
                      messages: [{ role: 'user', content: prompt }],
                      temperature: 0.7,
                      max_tokens: 100
                  };
              }
          } catch (error) {
              console.error('JSON parsing error:', error);
              // JSON parse hatası durumunda varsayılan yapıyı kullan
          }
      }
      // Basit model adı mı?
      else if (!template.includes('fetch(') && !template.includes('{')) {
          // Basit model adı durumunda, model adını kullan
          const modelName = template.trim();

          // Model adına göre API URL ve headers'ı belirle
          if (modelName.toLowerCase().includes('gpt')) {
              config.url = 'https://api.openai.com/v1/chat/completions';
              config.headers = {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
              };
              config.body.model = modelName;
          } else if (modelName.toLowerCase().includes('claude')) {
              config.url = 'https://api.anthropic.com/v1/messages';
              config.headers = {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01'
              };
              config.body = {
                  model: modelName,
                  messages: [{ role: 'user', content: prompt }],
                  max_tokens: 100
              };
          } else {
              // Diğer model adları için OpenRouter varsayılanını kullan
              config.body.model = modelName;
          }
      }
      // JavaScript fetch kodu mu?
      else if (template.includes('fetch(')) {
          // JavaScript fetch kodu durumunda, URL'yi çıkarmaya çalış
          const urlMatch = template.match(/fetch\s*\(\s*["']([^"']+)["']/);
          if (urlMatch && urlMatch[1]) {
              config.url = urlMatch[1];
          }

          // Model adını çıkarmaya çalış
          const modelMatch = template.match(/"model":\s*"([^"]+)"/);
          if (modelMatch && modelMatch[1]) {
              config.body.model = modelMatch[1];
          }
      }
  } catch (error) {
      console.error('Template parsing error:', error);
      // Hata durumunda varsayılan yapıyı kullan
  }

  return config;
}

// API yanıtından içeriği çıkar
function extractContentFromResponse(data: any): string {
  // Tüm olası yanıt formatlarını kontrol et
  if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
  } else if (data.content && data.content[0]?.text) {
      return data.content[0].text;
  } else if (data.content) {
      return typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
  } else if (data.output) {
      return typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
  } else if (data.text) {
      return data.text;
  } else if (data.response) {
      return typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
  } else if (data.result) {
      return typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
  } else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      // Google Gemini formatı
      return data.candidates[0].content.parts[0].text;
  } else if (data.message) {
      return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
  } else if (data.generated_text) {
      return data.generated_text;
  } else if (data.completion) {
      return data.completion;
  } else if (data.generations && data.generations.length > 0) {
      return data.generations[0].text || JSON.stringify(data.generations[0]);
  } else {
      // Hiçbir format eşleşmezse, tüm yanıtı JSON olarak döndür
      return JSON.stringify(data);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Oturum kontrolü
    const session = await getSession(request);

    if (!session?.user) {
      console.log('Test API: Oturum bulunamadı, hata döndürülüyor');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Lütfen oturum açın ve tekrar deneyin'
      }, { status: 200 });
    }

    // İstek gövdesini al
    const body = await request.json();
    const { modelId } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Modeli veritabanından al
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      include: { provider: true }
    });

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // Provider'dan API anahtarını al
    const apiKey = model.provider.apiKey;
    console.log(`Test API: Provider: ${model.provider.name}, API Key mevcut: ${!!apiKey}`);

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key not found for this provider'
        },
        { status: 200 }
      );
    }

    // API anahtarını temizle (boşlukları kaldır)
    let cleanedApiKey = apiKey.trim();

    // Eğer API anahtarı "Bearer " ile başlıyorsa, bu kısmı kaldır
    if (cleanedApiKey.startsWith('Bearer ')) {
      cleanedApiKey = cleanedApiKey.substring(7).trim();
      console.log(`Test API: Bearer öneki kaldırıldı`);
    }

    // OpenRouter API anahtarı için özel format kontrolü
    if (model.provider.name.toLowerCase().includes('openrouter') && !cleanedApiKey.startsWith('sk-or-')) {
      cleanedApiKey = `sk-or-v1-${cleanedApiKey}`;
      console.log(`Test API: OpenRouter API anahtarı formatı düzeltildi`);
    }

    // Test için basit bir prompt
    const prompt = "Merhaba, bu bir test mesajıdır.";

    // Zaman ölçümü başlat
    const startTime = Date.now();

    try {
      // API kodu içindeki değişkenleri değiştir
      let apiCode = model.apiCode || '';
      apiCode = apiCode.replace(/\{API_KEY\}/g, cleanedApiKey);
      apiCode = apiCode.replace(/\{PROMPT\}/g, prompt);

      console.log(`Test API: API kodu içindeki değişkenler değiştirildi`);

      // API isteği için gerekli bilgileri belirle
      const requestConfig = parseApiTemplate(apiCode, cleanedApiKey, prompt, model.id);

      console.log(`Test API: API isteği yapılıyor - URL: ${requestConfig.url}, Method: ${requestConfig.method}`);
      console.log(`Test API: Headers:`, JSON.stringify(requestConfig.headers, null, 2).replace(cleanedApiKey, '***API_KEY***'));
      console.log(`Test API: Request Body:`, JSON.stringify(requestConfig.body).substring(0, 100) + '...');

      // API isteği yap
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        body: JSON.stringify(requestConfig.body),
      });

      // Zaman ölçümü bitir
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const data = await response.json();

      // API yanıtını kontrol et
      if (!response.ok) {
        console.error('Test API Error:', data);
        console.error('Test API Status:', response.status, response.statusText);

        // Hata mesajını detaylı bir şekilde oluştur
        let errorMessage = data.error?.message || data.error || 'API request failed';

        // OpenRouter API'si için özel hata mesajları
        if (apiUrl.includes('openrouter.ai')) {
          if (response.status === 401) {
            errorMessage = 'OpenRouter API anahtarı geçersiz. Lütfen API anahtarını kontrol edin.';
          } else if (response.status === 404) {
            errorMessage = 'Model bulunamadı. Lütfen model adını kontrol edin.';
          } else if (response.status === 429) {
            errorMessage = 'API istek limiti aşıldı. Lütfen daha sonra tekrar deneyin.';
          }
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            statusCode: response.status,
            statusText: response.statusText,
            responseTime,
            rawError: data
          },
          { status: 200 } // Hata durumunda bile 200 döndür, client tarafında işlenecek
        );
      }

      // Yanıtı çıkar - tüm olası yanıt formatlarını destekle
      let result = extractContentFromResponse(data);

      return NextResponse.json({
        success: true,
        result,
        responseTime,
        rawResponse: data
      });
    } catch (apiError: any) {
      console.error('Test API: API isteği sırasında hata:', apiError);

      return NextResponse.json({
        success: false,
        error: `API isteği sırasında hata: ${apiError.message}`,
        details: apiError.stack
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in test-model API:', error);

    // Hata mesajını detaylı bir şekilde oluştur
    let errorMessage = error.message || 'Internal server error';

    // Fetch hatası için özel mesaj
    if (errorMessage.includes('fetch')) {
      errorMessage = 'API sunucusuna bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 200 } // Hata durumunda bile 200 döndür, client tarafında işlenecek
    );
  }
}
