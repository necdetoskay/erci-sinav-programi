import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Özel API isteği için yardımcı fonksiyon
async function callCustomAPI(apiKey: string, model: string, prompt: string, apiCode: string): Promise<{ success: boolean; questions?: string; error?: string; status: number }> {
    console.log(`Calling Custom API with model ${model}`);
    try {
        // API kodunu parse et
        let apiCodeObj;
        try {
            // API kodu boş veya geçersiz ise varsayılan bir yapı kullan
            if (!apiCode || apiCode.trim() === '') {
                console.log('API code is empty, using default OpenRouter format');
                apiCodeObj = {
                    model: "MODEL_NAME",
                    messages: [
                        {
                            role: "user",
                            content: "PROMPT"
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                };
            } else if (apiCode.trim().startsWith('fetch(')) {
                // JavaScript fetch kodu ise, varsayılan OpenRouter formatını kullan
                console.log('API code is JavaScript fetch code, extracting model name and using default OpenRouter format');

                // Model adını çıkarmaya çalış
                const modelMatch = apiCode.match(/"model"\s*:\s*"([^"]+)"/);
                const extractedModel = modelMatch ? modelMatch[1] : model;

                apiCodeObj = {
                    model: extractedModel,
                    messages: [
                        {
                            role: "user",
                            content: "PROMPT"
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                };
            } else {
                apiCodeObj = JSON.parse(apiCode);
            }
        } catch (error) {
            console.error('Error parsing API code:', error);
            console.log('Invalid API code, using default OpenRouter format');
            // JSON parse hatası durumunda varsayılan bir yapı kullan
            apiCodeObj = {
                model: "MODEL_NAME",
                messages: [
                    {
                        role: "user",
                        content: "PROMPT"
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            };
        }

        // API endpoint'ini al
        const endpoint = apiCodeObj.endpoint || 'https://openrouter.ai/api/v1/chat/completions';
        delete apiCodeObj.endpoint; // endpoint'i body'den çıkar

        // Headers'ı al
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': 'Akilli Sinav Sistemi',
            ...(apiCodeObj.headers || {})
        };
        delete apiCodeObj.headers; // headers'ı body'den çıkar

        // Body'yi oluştur
        const body = {
            ...apiCodeObj
        };

        // MODEL_NAME ve PROMPT değerlerini değiştir
        let bodyStr = JSON.stringify(body);

        // Eğer MODEL_NAME yoksa ekle
        if (!bodyStr.includes('MODEL_NAME')) {
            bodyStr = bodyStr.replace(/"model"\s*:\s*"[^"]*"/, `"model": "${model}"`);
        } else {
            bodyStr = bodyStr.replace(/MODEL_NAME/g, model);
        }

        // Eğer PROMPT yoksa ekle
        if (!bodyStr.includes('PROMPT')) {
            try {
                // messages dizisi varsa, ilk mesajın content'ine ekle
                if (bodyStr.includes('"messages"')) {
                    // Güvenli bir şekilde prompt'u ekle
                    const escapedPrompt = prompt
                        .replace(/\\/g, '\\\\')
                        .replace(/"/g, '\\"')
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\t/g, '\\t')
                        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

                    bodyStr = bodyStr.replace(/"content"\s*:\s*"[^"]*"/, `"content": "${escapedPrompt}"`);
                } else {
                    // messages dizisi yoksa, varsayılan bir messages dizisi ekle
                    const parsedTemp = JSON.parse(bodyStr);
                    parsedTemp.messages = [{ role: 'user', content: prompt }];
                    bodyStr = JSON.stringify(parsedTemp);
                }
            } catch (error) {
                console.error('Error modifying body JSON:', error);
                // Hata durumunda varsayılan bir yapı kullan
                const defaultBody = {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 2000
                };
                bodyStr = JSON.stringify(defaultBody);
            }
        } else {
            try {
                // Güvenli bir şekilde prompt'u ekle
                const escapedPrompt = prompt
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t')
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

                bodyStr = bodyStr.replace(/PROMPT/g, escapedPrompt);
            } catch (error) {
                console.error('Error replacing PROMPT:', error);
                // Hata durumunda varsayılan bir yapı kullan
                const defaultBody = {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 2000
                };
                bodyStr = JSON.stringify(defaultBody);
            }
        }

        try {
            // JSON parsing hatalarını önlemek için kontrol karakterlerini temizle
            const cleanBodyStr = bodyStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
            const parsedBody = JSON.parse(cleanBodyStr);
            console.log('API Endpoint:', endpoint);
            console.log('API Headers:', headers);
            console.log('API Body:', parsedBody);

            // API isteğini yap
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(parsedBody)
            });

            // Yanıtı text olarak al
            const responseText = await response.text();
            console.log('API Response Text:', responseText);

            // Yanıtı JSON olarak parse et
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                console.error('Error parsing API response:', error);
                return {
                    success: false,
                    error: `API yanıtı geçerli bir JSON formatında değil: ${responseText.substring(0, 200)}`,
                    status: 500
                };
            }

            if (!response.ok) {
                console.error('API Error:', data);
                return {
                    success: false,
                    error: data.error?.message || `API hatası: ${response.status}`,
                    status: response.status
                };
            }

            console.log('API Response:', data);

            // Yanıtı işle
            let questions = '';

            if (data.choices && data.choices[0] && data.choices[0].message) {
                questions = data.choices[0].message.content;
            } else if (data.content) {
                questions = data.content;
            } else if (data.output) {
                questions = data.output;
            } else if (data.text) {
                questions = data.text;
            } else if (data.response) {
                questions = data.response;
            } else if (data.result) {
                questions = data.result;
            } else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                // Google Gemini formatı
                questions = data.candidates[0].content.parts[0].text;
            } else {
                questions = JSON.stringify(data);
            }

            return { success: true, questions, status: 200 };
        } catch (error) {
            console.error('Error parsing body JSON:', error);
            return {
                success: false,
                error: `API isteği gövdesi oluşturulurken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
                status: 500
            };
        }
    } catch (error) {
        console.error('Custom API Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'API isteği sırasında bir hata oluştu',
            status: 500
        };
    }
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

    let result: { success: boolean; questions?: string; error?: string; status: number };

    // Model adına göre hangi API'nin çağrılacağını belirle

    // Önce veritabanından model bilgisini al
    console.log('Fetching model info for:', model);

    // Veritabanından model bilgisini al
    const modelInfo = await prisma.model.findFirst({
      where: {
        codeName: model
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
        apiKey = apiKey.trim();

        // Eğer API anahtarı "Bearer " ile başlıyorsa, bu kısmı kaldır
        if (apiKey.startsWith('Bearer ')) {
          apiKey = apiKey.substring(7).trim();
          console.log('Bearer öneki kaldırıldı');
        }

        // API anahtarını olduğu gibi kullan, format düzeltmesi yapma
        console.log(`API anahtarı formatı: ${apiKey.substring(0, 4)}...`);
      } else {
        console.error('API key is not defined for provider:', provider.name);
        return NextResponse.json({
          success: false,
          error: `"${provider.name}" provider'ı için API anahtarı tanımlanmamış. Lütfen provider ayarlarını kontrol edin.`
        }, { status: 400 });
      }

      // API kodunu kullanarak özel API isteği yap
      console.log('Using custom API code for model:', model);
      result = await callCustomAPI(apiKey, model, prompt, modelApiCode);
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
      return NextResponse.json({ success: false, error: result.error || 'API çağrısı sırasında bilinmeyen bir hata oluştu.' }, { status: result.status });
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
