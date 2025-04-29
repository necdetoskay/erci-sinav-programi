import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { content, difficulty, numberOfQuestions, model } = await req.json()

    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'İçerik boş olamaz'
      })
    }

    if (!numberOfQuestions || numberOfQuestions < 1 || numberOfQuestions > 5) {
      return NextResponse.json({
        success: false,
        error: 'Soru sayısı 1-5 arasında olmalıdır'
      })
    }

    if (!model) {
      return NextResponse.json({
        success: false,
        error: 'Model belirtilmedi'
      })
    }

    // Zorluk seviyesine göre prompt ayarla
    let difficultyText = ''
    switch (difficulty) {
      case 'easy':
        difficultyText = 'kolay zorluk seviyesinde, herkesin anlayabileceği basitlikte'
        break
      case 'medium':
        difficultyText = 'orta zorluk seviyesinde, temel bilgileri test eden'
        break
      case 'hard':
        difficultyText = 'zor zorluk seviyesinde, derin anlayış ve analiz gerektiren'
        break
      default:
        difficultyText = 'orta zorluk seviyesinde'
    }

    const prompt = `Aşağıdaki içerik hakkında ${numberOfQuestions} adet ${difficultyText} soru üret. 
Her soru için 4 seçenek oluştur ve doğru cevabı belirt.

Yanıtı aşağıdaki gibi JSON formatında ver:
{
  "questions": [
    {
      "question": "Soru metni",
      "options": [
        "A) Birinci seçenek",
        "B) İkinci seçenek", 
        "C) Üçüncü seçenek",
        "D) Dördüncü seçenek"
      ],
      "correctAnswer": "B",
      "explanation": "Doğru cevabın açıklaması"
    }
  ]
}

İçerik:
${content}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'Akilli Sinav Sistemi'
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
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const responseText = await response.text()
      console.error('OpenRouter Error Response:', responseText)
      
      try {
        const error = JSON.parse(responseText)
        return NextResponse.json({
          success: false,
          error: error.error?.message || 'API yanit vermedi'
        })
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        return NextResponse.json({
          success: false,
          error: `API yaniti islenemedi: ${responseText.substring(0, 100)}...`
        })
      }
    }

    try {
      // Response'u doğrudan JSON olarak alalım
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      
      if (!content) {
        return NextResponse.json({
          success: false,
          error: 'API yaniti geçersiz format'
        })
      }

      let parsedContent
      // Eğer content zaten bir object değilse, JSON olarak parse et
      if (typeof content === 'string') {
        try {
          parsedContent = JSON.parse(content)
        } catch (parseError) {
          console.error('Content parsing error:', parseError)
          return NextResponse.json({
            success: false,
            error: 'LLM yaniti JSON formatinda değil'
          })
        }
      } else {
        parsedContent = content
      }

      return NextResponse.json({
        success: true,
        data: parsedContent
      })
    } catch (error) {
      console.error('Response processing error:', error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Yanit islenirken bir hata olustu'
      })
    }
  } catch (error) {
    console.error('Test LLM Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test sirasinda bir hata olustu'
    }, { status: 500 })
  }
} 