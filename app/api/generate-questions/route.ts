import { NextResponse } from 'next/server';
// SDK importlarını kaldırıp fetch'e geri dönüyoruz.

// Google Gemini API için fetch kullanan yardımcı fonksiyon (Orijinal Hali)
async function callGoogleGeminiAPI(apiKey: string, model: string, prompt: string): Promise<{ success: boolean; questions?: string; error?: string; status: number }> {
  // Google Gemini API endpoint'i model adına göre dinamik olarak oluşturulabilir veya sabit olabilir.
  // Genellikle /v1beta/models/{model}:generateContent formatındadır.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  console.log(`Calling Google Gemini API: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // generationConfig: { // İsteğe bağlı yapılandırma
        //   temperature: 0.7,
        //   maxOutputTokens: 2000,
        // }
      }),
    });

    const responseDataText = await response.text();
    console.log('Google Gemini Raw Response Text:', responseDataText);

    let data;
    try {
      data = JSON.parse(responseDataText);
      console.log('Google Gemini Full Response Data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to parse Google Gemini response as JSON:', e);
      const status = response.status || 500;
      const errorMessage = `Google Gemini API yanıtı ayrıştırılamadı (HTTP ${status}). Yanıt: ${responseDataText.substring(0, 200)}`;
      return { success: false, error: errorMessage, status: status };
    }

    // Google API Hata Kontrolü (yanıt içindeki 'error')
    if (data?.error) {
      console.error('--- Google Gemini returned an error object ---');
      console.error('Google Gemini Error Data:', data.error);
      const errorStatus = data.error.code || response.status || 500;
      let errorMessage = data.error.message || `Google Gemini API hatası (kod ${errorStatus})`;
       // Google API 429 hatasını kontrol et
       if (errorStatus === 429) {
         errorMessage = `Google Gemini API kullanım kotası aşıldı (Hata: ${data.error.message || 'Bilinmiyor'}). Lütfen planınızı kontrol edin veya daha sonra tekrar deneyin.`;
         console.log(`!!! Returning 429 error from Google Gemini: ${errorMessage}`);
         return { success: false, error: errorMessage, status: 429 };
       }
      console.log(`!!! Returning error from Google Gemini JSON payload (status ${errorStatus}): ${errorMessage}`);
      return { success: false, error: errorMessage, status: typeof errorStatus === 'number' ? errorStatus : 500 };
    }

    // HTTP durumunu da kontrol et (yedek)
    if (!response.ok) {
        console.error(`--- Google Gemini API request failed (HTTP ${response.status}) ---`);
        const errorMessage = `Google Gemini API hatası (${response.status}). Detay: ${data?.error?.message || responseDataText.substring(0, 200)}`;
        return { success: false, error: errorMessage, status: response.status };
    }

    // Başarılı yanıtı işle (candidates yapısını kontrol et)
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('--- Invalid Google Gemini response format (no candidates/content/parts/text) ---', data);
      // Bazen blockReason olabilir, bunu da kontrol edelim
      const blockReason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      const blockMessage = blockReason ? ` İçerik engellendi (Sebep: ${blockReason}).` : '';
      return { success: false, error: `Google Gemini API yanıtı başarılı ancak beklenen içerik bulunamadı.${blockMessage}`, status: 500 };
    }

    console.log("--- Google Gemini call successful ---");
    return { success: true, questions: text, status: 200 };

  } catch (error) {
    console.error('Error calling Google Gemini API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Google Gemini API çağrılırken bilinmeyen bir hata oluştu.';
    return { success: false, error: errorMessage, status: 500 };
  }
}

// Groq API için yardımcı fonksiyon
async function callGroqAPI(apiKey: string, model: string, prompt: string): Promise<{ success: boolean; questions?: string; error?: string; status: number }> {
    console.log(`Calling Groq API with model ${model}`);
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { // Groq endpoint
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`, // Groq API anahtarı kullanılacak
                'Content-Type': 'application/json',
                // Groq için özel header'lar gerekirse buraya eklenebilir, şimdilik standart
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7, // Groq için isteğe bağlı parametreler
                max_tokens: 2000 // Groq için isteğe bağlı parametreler
            })
        });

        const responseDataText = await response.text();
        console.log('Groq Raw Response Text:', responseDataText); // Log mesajını güncelle

        let data;
        try {
            data = JSON.parse(responseDataText);
            console.log('Groq Full Response Data:', JSON.stringify(data, null, 2)); // Log mesajını güncelle
        } catch (e) {
            console.error('Failed to parse Groq response as JSON:', e); // Log mesajını güncelle
            const status = response.status || 500;
            const errorMessage = `Groq API yanıtı ayrıştırılamadı (HTTP ${status}). Yanıt: ${responseDataText.substring(0, 200)}`; // Hata mesajını güncelle
            return { success: false, error: errorMessage, status: status };
        }

        // Groq Hata Kontrolü (yanıt içindeki 'error') - OpenAI formatına benzer
        if (data?.error) {
            console.error('--- Groq returned an error object ---'); // Log mesajını güncelle
            console.error('Groq Error Data:', data.error); // Log mesajını güncelle
            const errorStatus = data.error.code || response.status || 500;
            let errorMessage = data.error.message || `Groq API hatası (kod ${errorStatus})`; // Hata mesajını güncelle
            // Hız sınırı hatasını (429) özel olarak ele al
            if (errorStatus === 429 || String(errorStatus).startsWith('429')) {
                errorMessage = data?.error?.message || `Seçilen model (${model}) için Groq kullanım kotası aşıldı. Lütfen farklı bir model deneyin veya planınızı kontrol edin.`; // Hata mesajını güncelle
                console.log(`!!! Returning 429 error from Groq: ${errorMessage}`); // Log mesajını güncelle
                return { success: false, error: errorMessage, status: 429 };
            }
            console.log(`!!! Returning error from Groq JSON payload (status ${errorStatus}): ${errorMessage}`); // Log mesajını güncelle
            return { success: false, error: errorMessage, status: typeof errorStatus === 'number' ? errorStatus : 500 };
        }

        // HTTP durumunu da kontrol et (yedek)
        if (!response.ok) {
            console.error(`--- Groq API request failed (HTTP ${response.status}) ---`); // Log mesajını güncelle
            const errorMessage = `Groq API hatası (${response.status}). Detay: ${data?.error?.message || responseDataText.substring(0, 200)}`; // Hata mesajını güncelle
            return { success: false, error: errorMessage, status: response.status };
        }

        // Başarılı yanıtı işle (OpenAI formatına benzer)
        const text = data?.choices?.[0]?.message?.content;
        if (!text) {
            console.error('--- Invalid Groq response format (no choices/content) ---'); // Log mesajını güncelle
            return { success: false, error: 'Groq API yanıtı başarılı ancak beklenen içerik bulunamadı.', status: 500 }; // Hata mesajını güncelle
        }

        console.log("--- Groq call successful ---"); // Log mesajını güncelle
        return { success: true, questions: text, status: 200 };

    } catch (error) {
        console.error('Error calling Groq API:', error); // Log mesajını güncelle
        const errorMessage = error instanceof Error ? error.message : 'Groq API çağrılırken bilinmeyen bir hata oluştu.'; // Hata mesajını güncelle
        return { success: false, error: errorMessage, status: 500 };
    }
}


// OpenRouter API için yardımcı fonksiyon (Değişiklik Yok)
async function callOpenRouterAPI(apiKey: string, model: string, prompt: string): Promise<{ success: boolean; questions?: string; error?: string; status: number }> {
    console.log(`Calling OpenRouter API with model ${model}`);
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000', // Gerekliyse ekleyin
                'X-Title': 'Akilli Sinav Sistemi' // Gerekliyse ekleyin
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        const responseDataText = await response.text();
        console.log('OpenRouter Raw Response Text:', responseDataText);

        let data;
        try {
            data = JSON.parse(responseDataText);
            console.log('OpenRouter Full Response Data:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('Failed to parse OpenRouter response as JSON:', e);
            const status = response.status || 500;
            const errorMessage = `OpenRouter API yanıtı ayrıştırılamadı (HTTP ${status}). Yanıt: ${responseDataText.substring(0, 200)}`;
            return { success: false, error: errorMessage, status: status };
        }

        // OpenRouter Hata Kontrolü (yanıt içindeki 'error')
        if (data?.error) {
            console.error('--- OpenRouter returned an error object ---');
            console.error('OpenRouter Error Data:', data.error);
            const errorStatus = data.error.code || response.status || 500;
            let errorMessage = data.error.message || `OpenRouter API hatası (kod ${errorStatus})`;
            // Hız sınırı hatasını (429) özel olarak ele al
            if (errorStatus === 429 || String(errorStatus).startsWith('429')) {
                errorMessage = data?.error?.message || `Seçilen model (${model}) için OpenRouter kullanım kotası aşıldı. Lütfen farklı bir model deneyin veya planınızı kontrol edin.`;
                console.log(`!!! Returning 429 error from OpenRouter: ${errorMessage}`);
                return { success: false, error: errorMessage, status: 429 };
            }
            console.log(`!!! Returning error from OpenRouter JSON payload (status ${errorStatus}): ${errorMessage}`);
            return { success: false, error: errorMessage, status: typeof errorStatus === 'number' ? errorStatus : 500 };
        }

        // HTTP durumunu da kontrol et (yedek)
        if (!response.ok) {
            console.error(`--- OpenRouter API request failed (HTTP ${response.status}) ---`);
            const errorMessage = `OpenRouter API hatası (${response.status}). Detay: ${data?.error?.message || responseDataText.substring(0, 200)}`;
            return { success: false, error: errorMessage, status: response.status };
        }

        // Başarılı yanıtı işle
        const text = data?.choices?.[0]?.message?.content;
        if (!text) {
            console.error('--- Invalid OpenRouter response format (no choices/content) ---');
            return { success: false, error: 'OpenRouter API yanıtı başarılı ancak beklenen içerik bulunamadı.', status: 500 };
        }

        console.log("--- OpenRouter call successful ---");
        return { success: true, questions: text, status: 200 };

    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        const errorMessage = error instanceof Error ? error.message : 'OpenRouter API çağrılırken bilinmeyen bir hata oluştu.';
        return { success: false, error: errorMessage, status: 500 };
    }
}


// Ana API Route Handler
export async function POST(req: Request) {
  try {
    const { content, numberOfQuestions, optionsPerQuestion, model } = await req.json();

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
    const prompt = `Aşağıdaki içerik hakkında ${numberOfQuestions} adet çoktan seçmeli soru üret. Her soru için ${optionsPerQuestion} seçenek olmalı (A, B, C, ...) ve doğru cevabı belirtmelisin. Ayrıca her doğru cevap için kısa bir açıklama ekle.

İçerik:
${content}

Örnek format:
1. Soru metni?
A) Seçenek A
B) Seçenek B
C) Seçenek C
${optionsPerQuestion > 3 ? 'D) Seçenek D' : ''}
${optionsPerQuestion > 4 ? 'E) Seçenek E' : ''}
${optionsPerQuestion > 5 ? 'F) Seçenek F' : ''}
Doğru Cevap: B
Açıklama: B'nin doğru cevap olmasının kısa açıklaması.`;

    let result: { success: boolean; questions?: string; error?: string; status: number };

    // Model adına göre hangi API'nin çağrılacağını belirle
    const lowerCaseModel = model.toLowerCase();
    const isGoogleModel = lowerCaseModel.includes('gemini');
    // Groq modellerini kontrol et (örneğin 'llama' içeriyorsa veya belirli bir Groq modeli ise)
    const isGroqModel = lowerCaseModel.includes('llama') || lowerCaseModel.includes('mixtral') || model === 'meta-llama/llama-4-scout-17b-16e-instruct'; // Groq'un desteklediği diğer modeller eklenebilir

    if (isGoogleModel) {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        console.error('Google API Key (GOOGLE_API_KEY) is not configured.');
        return NextResponse.json({ success: false, error: 'Google API anahtarı yapılandırılmamış.' }, { status: 500 });
      }
      // Google API'sine gönderilecek temiz model adını al
      let geminiModelName = model.toLowerCase().startsWith('google/') ? model.substring(7) : model;
      geminiModelName = geminiModelName.startsWith('models/') ? geminiModelName.substring(7) : geminiModelName;
      
      console.log(`Routing to Google Gemini with cleaned model name: ${geminiModelName}`);
      result = await callGoogleGeminiAPI(apiKey, geminiModelName, prompt);
    } else if (isGroqModel) { // Groq kontrolü eklendi
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          console.error('Groq API Key (GROQ_API_KEY) is not configured.');
          return NextResponse.json({ success: false, error: 'Groq API anahtarı yapılandırılmamış.' }, { status: 500 });
        }
        console.log(`Routing to Groq with model name: ${model}`);
        result = await callGroqAPI(apiKey, model, prompt); // callGroqAPI çağrılıyor
    } else {
      // Diğer tüm modeller için OpenRouter'ı kullan (varsayılan)
      console.log(`Routing to OpenRouter with model name: ${model}`);
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error('OpenRouter API Key (OPENROUTER_API_KEY) is not configured.');
        return NextResponse.json({ success: false, error: 'OpenRouter API anahtarı yapılandırılmamış.' }, { status: 500 });
      }
      result = await callOpenRouterAPI(apiKey, model, prompt);
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
