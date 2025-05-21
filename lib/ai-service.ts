import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, Message as CoreMessage } from 'ai'
import { getApiKey } from '@/lib/api-key-service'

// Artık API anahtarını veritabanından alacağız, bu sabit değer sadece fallback
const SITE_URL = process.env.SITE_URL || 'http://localhost:3001'
const SITE_NAME = 'Akıllı Sınav Sistemi'

export type ModelType = string

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

interface TextContent {
  type: 'text'
  text: string
}

interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string
  }
}

type MessageContent = string | (TextContent | ImageContent)[]

type Message = CoreMessage & {
  content: MessageContent
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

interface GenerateQuestionsParams {
  content: string
  difficulty: DifficultyLevel
  numberOfQuestions: number
  model: ModelType
}

/**
 * Çoktan seçmeli sorular üretir
 * @param content İçerik
 * @param difficulty Zorluk seviyesi
 * @param numberOfQuestions Soru sayısı
 * @param model Kullanılacak model
 * @returns Üretilen sorular
 */
export async function generateQuestions({
  content,
  difficulty,
  numberOfQuestions,
  model
}: GenerateQuestionsParams): Promise<string> {
  const difficultyInTurkish = {
    easy: 'kolay',
    medium: 'orta',
    hard: 'zor'
  }[difficulty]

  const prompt = `Aşağıdaki içerik hakkında ${numberOfQuestions} adet ${difficultyInTurkish} seviyede çoktan seçmeli soru üret. Her soru için 4 seçenek (A, B, C, D) olmalı ve doğru cevabı belirtmelisin. Ayrıca her doğru cevap için kısa bir açıklama ekle.

İçerik:
${content}

Örnek format:
1. Soru metni?
A) Seçenek A
B) Seçenek B
C) Seçenek C
D) Seçenek D
Doğru Cevap: B
Açıklama: B'nin doğru cevap olmasının kısa açıklaması.`

  // Model adına göre hangi API'nin kullanılacağını belirle
  const lowerCaseModel = model.toLowerCase();
  const isGoogleModel = lowerCaseModel.includes('gemini');

  try {
    let apiKey: string | null;
    let result: string;

    if (isGoogleModel) {
      // Google Gemini API'sini kullan
      apiKey = await getApiKey('Google', '');
      if (!apiKey) {
        throw new Error('Google API anahtarı veritabanında bulunamadı. Lütfen yönetici panelinden API anahtarını ekleyin.');
      }
      result = await callGoogleAPI(apiKey, model, prompt);
    } else {
      // OpenRouter API'sini kullan (varsayılan)
      apiKey = await getApiKey('Open Router', '');
      if (!apiKey) {
        throw new Error('OpenRouter API anahtarı veritabanında bulunamadı. Lütfen yönetici panelinden API anahtarını ekleyin.');
      }
      result = await callOpenRouterAPI(apiKey, model, prompt);
    }

    return result;
  } catch (error) {
    console.error('AI API Error:', error);
    throw new Error('Sorular üretilemedi');
  }
}

/**
 * OpenRouter API'sine istek gönderir
 * @param apiKey API anahtarı
 * @param model Model adı
 * @param prompt İstek metni
 * @returns API yanıtı
 */
export async function callOpenRouterAPI(apiKey: string, model: string, prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': 'Akıllı Sınav Sistemi'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('OpenRouter Error:', error);
    throw new Error(error.error?.message || 'API yanıt vermedi');
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('API yanıtı geçersiz format');
  }

  return text;
}

/**
 * Google Gemini API'sine istek gönderir
 * @param apiKey API anahtarı
 * @param model Model adı
 * @param prompt İstek metni
 * @returns API yanıtı
 */
export async function callGoogleAPI(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = new URL('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');
  url.searchParams.append('key', apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Google API Error:', error);
    throw new Error(error.error?.message || 'API yanıt vermedi');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('API yanıtı geçersiz format');
  }

  return text;
}



/**
 * Görsel analizi yapar
 * @param imageUrl Görsel URL'si
 * @param question Soru metni
 * @param model Kullanılacak model
 * @returns Analiz sonucu
 */
export async function analyzeImage(imageUrl: string, question: string, model: ModelType = 'google/gemini-2.0-flash-exp:free'): Promise<string> {
  // Model adına göre hangi API'nin kullanılacağını belirle
  const lowerCaseModel = model.toLowerCase();
  const isGoogleModel = lowerCaseModel.includes('gemini');

  try {
    let apiKey: string | null;

    if (isGoogleModel) {
      // Google Gemini API'sini kullan
      apiKey = await getApiKey('Google', '');
      if (!apiKey) {
        throw new Error('Google API anahtarı veritabanında bulunamadı. Lütfen yönetici panelinden API anahtarını ekleyin.');
      }
      // Google Gemini API için görsel analizi fonksiyonu eklenecek
    } else {
      // OpenRouter API'sini kullan (varsayılan)
      apiKey = await getApiKey('Open Router', '');
      if (!apiKey) {
        throw new Error('OpenRouter API anahtarı veritabanında bulunamadı. Lütfen yönetici panelinden API anahtarını ekleyin.');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'Akıllı Sınav Sistemi'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: `${question}\n\nGörsel URL: ${imageUrl}`
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenRouter Error:', error);
        throw new Error(error.error?.message || 'API yanıt vermedi');
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('Görsel analizi başarısız oldu');
      }

      return text;
    }

    throw new Error('Bu model için görsel analizi henüz desteklenmiyor');
  } catch (error) {
    console.error('Görsel analizi hatası:', error);
    throw error;
  }
}

/**
 * Soru üretme işlevini test eder
 * @returns Test sonucu
 */
export async function testQuestionGeneration() {
  const testContent = `
  Web geliştirme, web siteleri ve web uygulamaları oluşturma sürecidir.
  Frontend geliştirme, kullanıcı arayüzü ve etkileşimini içerirken,
  backend geliştirme sunucu tarafı işlemleri ve veritabanı yönetimini kapsar.
  HTML sayfa yapısını, CSS stilleri, JavaScript ise etkileşimi sağlar.
  `;

  try {
    const result = await generateQuestions({
      content: testContent,
      difficulty: 'medium',
      numberOfQuestions: 2,
      model: 'anthropic/claude-3-sonnet:beta'
    });
    console.log('Generated Questions:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}
