import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'Akilli Sinav Sistemi'
      },
      body: {
          model: 'meta-llama/llama-4-maverick:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
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
                      max_tokens: 2000
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
                  max_tokens: 2000
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

// Ana API Route Handler
export async function POST(req: Request) {
  try {
    const { content, numberOfQuestions, optionsPerQuestion, model, difficulty = "medium" } = await req.json();

    // Input validation checks...
    if (!content) {
      return NextResponse.json({ success: false, error: 'İçerik boş olamaz' }, { status: 400 });
    }
    if (!numberOfQuestions || numberOfQuestions < 1 || numberOfQuestions > 10) {
      return NextResponse.json({ success: false, error: 'Soru sayısı 1-10 arasında olmalıdır' }, { status: 400 });
    }
    if (!optionsPerQuestion || optionsPerQuestion < 2 || optionsPerQuestion > 6) {
      return NextResponse.json({ success: false, error: 'Seçenek sayısı 2-6 arasında olmalıdır' }, { status: 400 });
    }
    if (!model) {
      return NextResponse.json({ success: false, error: 'Model belirtilmedi' }, { status: 400 });
    }

    // Prompt oluşturma...
    // Şık sayısını 4 ile sınırla
    const actualOptionsCount = Math.min(4, optionsPerQuestion);

    // Zorluk seviyesini Türkçe'ye çevir
    const difficultyInTurkish = {
      easy: 'kolay',
      medium: 'orta',
      hard: 'zor'
    }[difficulty] || 'orta';

    const prompt = `Aşağıdaki içerik hakkında ${numberOfQuestions} adet ${difficultyInTurkish} seviyede çoktan seçmeli soru üret.

ÖNEMLİ KURALLAR:
1. Her soru için SADECE 4 seçenek olmalı (A, B, C, D) - daha fazla değil, daha az değil.
2. E, F veya başka harflerle şık OLUŞTURMA. Sadece A, B, C, D şıklarını kullan.
3. Doğru cevap da sadece A, B, C veya D olabilir.
4. Her doğru cevap için kısa bir açıklama ekle.
5. Markdown formatı kullanma, düz metin olarak yanıt ver.
6. Yanıtında ** işaretleri kullanma.

İçerik:
${content}

Örnek format:
1. Soru metni?
A) Seçenek A
B) Seçenek B
C) Seçenek C
D) Seçenek D
Doğru Cevap: B
Açıklama: B'nin doğru cevap olmasının kısa açıklaması.

TEKRAR UYARI: Sadece A, B, C, D şıklarını kullan. Başka şık ekleme. Markdown formatı kullanma ve ** işaretleri kullanma.`;

    let result = { success: false, questions: '', error: '', status: 0 };

    // Önce veritabanından model bilgisini al
    console.log('Fetching model info for:', model);

    // Veritabanından model bilgisini al
    const modelInfo = await prisma.model.findFirst({
      where: {
        id: model
      }
    });

    console.log('Model info from database:', modelInfo);

    // Model API kodunu al
    const modelApiCode = modelInfo?.apiCode || '';
    console.log('Model API code:', modelApiCode);

    // API kodu yoksa hata döndür
    if (!modelApiCode) {
      console.error('API code is not defined for model:', model);
      return NextResponse.json({
        success: false,
        error: `"${modelInfo?.name || model}" modeli için API kodu tanımlanmamış. Lütfen model ayarlarından API kodunu ekleyin.`
      }, { status: 400 });
    }

    console.log('Original Model:', model);

    // API kodunu kullanarak API isteği yap
    try {
      console.log('Using API code for model:', model);

      // API anahtarını al - provider'a göre
      let providerId = modelInfo?.providerId;
      if (!providerId) {
        console.error('Provider ID is not defined for model:', model);
        return NextResponse.json({
          success: false,
          error: `"${modelInfo?.name || model}" modeli için provider tanımlanmamış. Lütfen model ayarlarını kontrol edin.`
        }, { status: 400 });
      }

      // Provider'ı bul
      const provider = await prisma.provider.findUnique({
        where: {
          id: providerId
        }
      });

      if (!provider) {
        console.error('Provider not found for model:', model);
        return NextResponse.json({
          success: false,
          error: `"${modelInfo?.name || model}" modeli için provider bulunamadı. Lütfen model ayarlarını kontrol edin.`
        }, { status: 400 });
      }

      // API anahtarını al
      let apiKey = provider.apiKey;

      // API anahtarının formatını kontrol et
      if (apiKey) {
        console.log('API anahtarı formatı kontrol ediliyor...');
        // Boşlukları temizle
        let cleanedApiKey = apiKey.trim();

        // Eğer API anahtarı "Bearer " ile başlıyorsa, bu kısmı kaldır
        if (cleanedApiKey.startsWith('Bearer ')) {
          cleanedApiKey = cleanedApiKey.substring(7).trim();
          console.log('Bearer öneki kaldırıldı');
        }

        // OpenRouter API anahtarı için özel format kontrolü
        if (provider.name.toLowerCase().includes('openrouter') && !cleanedApiKey.startsWith('sk-or-')) {
          cleanedApiKey = `sk-or-v1-${cleanedApiKey}`;
          console.log('OpenRouter API anahtarı formatı düzeltildi');
        }

        // Temizlenmiş API anahtarını kullan
        console.log(`API anahtarı formatı: ${cleanedApiKey.substring(0, 4)}...`);
        apiKey = cleanedApiKey;
      } else {
        console.error('API key is not defined for provider:', provider.name);
        return NextResponse.json({
          success: false,
          error: `"${provider.name}" provider'ı için API anahtarı tanımlanmamış. Lütfen provider ayarlarını kontrol edin.`
        }, { status: 400 });
      }

      // API kodu içindeki değişkenleri değiştir - Test sayfasındaki yaklaşımı kullan
      let apiCode = modelApiCode || '';
      apiCode = apiCode.replace(/\{API_KEY\}/g, apiKey);
      apiCode = apiCode.replace(/\{PROMPT\}/g, prompt);

      console.log('API kodu içindeki değişkenler değiştirildi');

      // API isteği için gerekli bilgileri belirle - Test sayfasındaki parseApiTemplate fonksiyonunu kullan
      const requestConfig = parseApiTemplate(apiCode, apiKey, prompt, modelInfo?.name || 'meta-llama/llama-4-maverick:free');

      console.log(`API isteği yapılıyor - URL: ${requestConfig.url}, Method: ${requestConfig.method}`);
      console.log('API Headers:', JSON.stringify(requestConfig.headers, null, 2).replace(apiKey, '***API_KEY***'));
      console.log('API Body:', JSON.stringify(requestConfig.body).substring(0, 100) + '...');

      // API isteğini yap
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        body: JSON.stringify(requestConfig.body),
      });

      // Yanıtı JSON olarak al
      const data = await response.json();

      // API yanıtını kontrol et
      if (!response.ok) {
        console.error('API Error:', data);
        console.error('API Status:', response.status, response.statusText);

        // Hata mesajını detaylı bir şekilde oluştur
        let errorMessage = data.error?.message || data.error || 'API request failed';

        // OpenRouter API'si için özel hata mesajları
        if (requestConfig.url && requestConfig.url.includes('openrouter.ai')) {
          if (response.status === 401) {
            errorMessage = 'OpenRouter API anahtarı geçersiz. Lütfen API anahtarını kontrol edin.';
          } else if (response.status === 404) {
            errorMessage = 'Model bulunamadı. Lütfen model adını kontrol edin.';
          } else if (response.status === 429) {
            errorMessage = 'API istek limiti aşıldı. Lütfen daha sonra tekrar deneyin.';
          } else if (data.error && data.error.message && data.error.message.includes('is not a valid model ID')) {
            errorMessage = 'Geçersiz model ID formatı. Lütfen model ayarlarında model ID\'si yerine geçerli bir model adı kullanın. Örneğin: "meta-llama/llama-4-maverick:free"';
          }
        } else {
          // Genel hata mesajları
          if (response.status === 401) {
            errorMessage = 'API anahtarı geçersiz. Lütfen API anahtarını kontrol edin.';
          } else if (response.status === 404) {
            errorMessage = 'Model bulunamadı veya API endpoint geçersiz. Lütfen model adını ve API kodunu kontrol edin.';
          } else if (response.status === 429) {
            errorMessage = 'API istek limiti aşıldı. Lütfen daha sonra tekrar deneyin.';
          } else if (data.error && data.error.message && data.error.message.includes('is not a valid model ID')) {
            errorMessage = 'Geçersiz model ID formatı. Lütfen model ayarlarında model ID\'si yerine geçerli bir model adı kullanın. Örneğin: "meta-llama/llama-4-maverick:free"';
          }
        }

        result = {
          success: false,
          error: errorMessage,
          status: response.status
        };
      } else {
        console.log('API Response:', data);

        // Yanıtı işle - tüm olası yanıt formatlarını destekle
        let questions = extractContentFromResponse(data);

        result = {
          success: true,
          questions,
          status: 200
        };
      }
    } catch (error) {
      console.error('Error calling API:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'API isteği sırasında bir hata oluştu.'
      }, { status: 500 });
    }

    // API çağrısının sonucunu kontrol et
    if (!result.success) {
      // Hata durumunda uygun yanıtı döndür
      return NextResponse.json({ success: false, error: result.error || 'API çağrısı sırasında bilinmeyen bir hata oluştu.' }, { status: result.status || 500 });
    }

    // Başarılı yanıtı döndür
    return NextResponse.json({
      success: true,
      questions: result.questions
    });
  } catch (error) {
    console.error('Generate Questions Error (Outer Catch):', error);
    // Genel try-catch bloğundaki hatalar için
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sorular oluşturulurken beklenmedik bir sunucu hatası oluştu.'
    }, { status: 500 });
  }
}