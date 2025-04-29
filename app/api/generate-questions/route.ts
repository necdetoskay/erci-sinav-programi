import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { content, numberOfQuestions, optionsPerQuestion, model } = await req.json()

    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'İçerik boş olamaz'
      })
    }

    if (!numberOfQuestions || numberOfQuestions < 1 || numberOfQuestions > 10) {
      return NextResponse.json({
        success: false,
        error: 'Soru sayısı 1-10 arasında olmalıdır'
      })
    }

    if (!optionsPerQuestion || optionsPerQuestion < 2 || optionsPerQuestion > 6) {
      return NextResponse.json({
        success: false,
        error: 'Seçenek sayısı 2-6 arasında olmalıdır'
      })
    }

    if (!model) {
      return NextResponse.json({
        success: false,
        error: 'Model belirtilmedi'
      })
    }

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
Açıklama: B'nin doğru cevap olmasının kısa açıklaması.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
      return NextResponse.json({
        success: false,
        error: error.error?.message || 'API yanıt vermedi'
      })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      return NextResponse.json({
        success: false,
        error: 'API yanıtı geçersiz format'
      })
    }

    return NextResponse.json({
      success: true,
      questions: text
    })
  } catch (error) {
    console.error('Generate Questions Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sorular oluşturulurken bir hata oluştu'
    }, { status: 500 })
  }
} 