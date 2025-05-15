import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { z } from 'zod';

// İstek şeması
const TestModelSchema = z.object({
  apiKey: z.string().min(1, 'API anahtarı gereklidir'),
  model: z.string().min(1, 'Model adı gereklidir'),
  prompt: z.string().min(1, 'Prompt gereklidir'),
});

export async function POST(request: NextRequest) {
  try {
    // Oturum kontrolü
    const session = await getSession(request);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece SUPERADMIN rolüne sahip kullanıcılar erişebilir
    if (session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // İstek gövdesini al ve doğrula
    const body = await request.json();
    const validation = TestModelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { apiKey, model, prompt } = validation.data;

    // Model adına göre hangi API'nin kullanılacağını belirle
    let apiUrl: string;
    let headers: Record<string, string>;
    let requestBody: any;

    // OpenAI API
    if (model.toLowerCase().includes('gpt')) {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      requestBody = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      };
    }
    // Anthropic API (Claude)
    else if (model.toLowerCase().includes('claude')) {
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
      requestBody = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000
      };
    }
    // Groq API
    else if (model.toLowerCase().includes('llama') || model.toLowerCase().includes('mixtral')) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      requestBody = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      };
    }
    // Varsayılan olarak OpenRouter API
    else {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://kentkonut.com.tr',
        'X-Title': 'Kent Konut Sinav Portali'
      };
      requestBody = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      };
    }

    // API isteği yap
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // API yanıtını kontrol et
    if (!response.ok) {
      console.error('API Error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'API request failed' },
        { status: response.status }
      );
    }

    // Yanıtı çıkar
    let result = '';

    // OpenAI ve Groq formatı
    if (data.choices && data.choices[0]?.message?.content) {
      result = data.choices[0].message.content;
    }
    // Anthropic formatı
    else if (data.content && data.content[0]?.text) {
      result = data.content[0].text;
    }
    // Diğer formatlar
    else {
      result = JSON.stringify(data);
    }

    return NextResponse.json({ result });

  } catch (error: any) {
    console.error('Error in test-model API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
