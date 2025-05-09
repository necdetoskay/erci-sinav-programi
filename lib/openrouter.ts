import { generateText, Message as CoreMessage } from 'ai'

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

  try {
    let apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OpenRouter API key is not configured. Please set the OPENROUTER_API_KEY environment variable.');
      throw new Error('OpenRouter API anahtarı yapılandırılmamış. Lütfen OPENROUTER_API_KEY çevre değişkenini ayarlayın.');
    }

    // API anahtarının formatını kontrol et ve düzelt (llm-status/route.ts ile aynı mantık)
    if (apiKey && !apiKey.startsWith('sk-or-')) {
      if (apiKey.startsWith('Bearer ')) {
        apiKey = apiKey.substring(7);
      }
      if (!apiKey.startsWith('sk-or-')) {
        apiKey = `sk-or-v1-${apiKey}`;
      }
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
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenRouter Error:', error)
      throw new Error(error.error?.message || 'API yanıt vermedi')
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      throw new Error('API yanıtı geçersiz format')
    }

    return text
  } catch (error) {
    console.error('OpenRouter API Error:', error)
    throw new Error('Sorular üretilemedi')
  }
}

// Image analysis function
export async function analyzeImage(imageUrl: string, question: string, model: ModelType = 'google/gemini-2.0-flash-exp:free'): Promise<string> {
  try {
    let apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OpenRouter API key is not configured. Please set the OPENROUTER_API_KEY environment variable.');
      throw new Error('OpenRouter API anahtarı yapılandırılmamış. Lütfen OPENROUTER_API_KEY çevre değişkenini ayarlayın.');
    }

    // API anahtarının formatını kontrol et ve düzelt (llm-status/route.ts ile aynı mantık)
    if (apiKey && !apiKey.startsWith('sk-or-')) {
      if (apiKey.startsWith('Bearer ')) {
        apiKey = apiKey.substring(7);
      }
      if (!apiKey.startsWith('sk-or-')) {
        apiKey = `sk-or-v1-${apiKey}`;
      }
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
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenRouter Error:', error)
      throw new Error(error.error?.message || 'API yanıt vermedi')
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      throw new Error('Görsel analizi başarısız oldu')
    }

    return text
  } catch (error) {
    console.error('Görsel analizi hatası:', error)
    throw error
  }
}

// Test function
export async function testQuestionGeneration() {
  const testContent = `
  Web geliştirme, web siteleri ve web uygulamaları oluşturma sürecidir.
  Frontend geliştirme, kullanıcı arayüzü ve etkileşimini içerirken,
  backend geliştirme sunucu tarafı işlemleri ve veritabanı yönetimini kapsar.
  HTML sayfa yapısını, CSS stilleri, JavaScript ise etkileşimi sağlar.
  `

  try {
    const result = await generateQuestions({
      content: testContent,
      difficulty: 'medium',
      numberOfQuestions: 2,
      model: 'anthropic/claude-3-sonnet:beta'
    })
    console.log('Generated Questions:', result)
    return result
  } catch (error) {
    console.error('Test failed:', error)
    throw error
  }
}
