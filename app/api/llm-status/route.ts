import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // OpenRouter API anahtarını kontrol et
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('API key missing')
      return NextResponse.json({
        status: 'error',
        message: 'OpenRouter API anahtari bulunamadi'
      })
    }

    console.log('Sending request to OpenRouter...')
    
    // OpenRouter bağlantısını test et
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'Akilli Sinav Sistemi'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet:beta',
        messages: [
          {
            role: 'user',
            content: 'Hello'  // Türkçe karakter içermeyen test mesajı
          }
        ],
        max_tokens: 50
      })
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const responseText = await response.text()
      console.error('OpenRouter Error Response:', responseText)
      
      try {
        const error = JSON.parse(responseText)
        throw new Error(error.error?.message || 'API yanit vermedi')
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        throw new Error(`API yaniti islenemedi: ${responseText.substring(0, 100)}...`)
      }
    }

    const responseText = await response.text()
    console.log('Response text:', responseText)

    try {
      const data = JSON.parse(responseText)
      const text = data.choices?.[0]?.message?.content

      if (text) {
        return new NextResponse(
          JSON.stringify({ status: 'ready' }),
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
            message: 'LLM servisi yanit vermedi'
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
      throw new Error(`Basarili yanit islenemedi: ${responseText.substring(0, 100)}...`)
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