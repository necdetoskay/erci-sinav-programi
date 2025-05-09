import { NextResponse } from "next/server";
import { getApiKey } from '@/lib/api-key-service';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Önce veritabanından API anahtarını almayı dene, yoksa çevre değişkeninden al
    const apiKey = await getApiKey('OpenRouter', 'OPENROUTER_API_KEY');
    console.log('API Key (ilk 10 karakter):', apiKey ? apiKey.substring(0, 10) + '...' : 'null');
    if (!apiKey) {
      throw new Error("OpenRouter API anahtarı veritabanında veya çevre değişkenlerinde yapılandırılmamış");
    }

    if (!process.env.APP_URL) {
      throw new Error("APP_URL is not defined");
    }

    // prompt: { text: string, imageUrl?: string }
    if (!prompt || (!prompt.text && !prompt.imageUrl)) {
      return new NextResponse(
        JSON.stringify({ error: "En az bir metin veya görsel içeriği göndermelisiniz." }),
        { status: 400 }
      );
    }

    const contentArray = [];
    if (prompt.text) {
      contentArray.push({ type: "text", text: prompt.text });
    }
    if (prompt.imageUrl) {
      contentArray.push({ type: "image_url", image_url: { url: prompt.imageUrl } });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Erci Sinav Programi",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "user",
            content: contentArray
          }
        ]
      }),
    });

    const data = await response.json();
    console.log("OpenRouter API Response:", data);

    if (!response.ok || data.error) {
      return new NextResponse(
        JSON.stringify({
          error: data.error?.message || `API request failed: ${response.status} ${response.statusText}`,
          details: data.error || null
        }),
        { status: response.status }
      );
    }

    if (!data.choices || !data.choices[0]?.message?.content) {
      return new NextResponse(
        JSON.stringify({ error: "API'den beklenen formatta cevap alınamadı." }),
        { status: 500 }
      );
    }

    let content = data.choices[0].message.content;

    // Markdown kod bloğu işaretlerini temizle
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      // JSON formatını kontrol et ve gerekli alanların varlığını doğrula
      const parsedContent = JSON.parse(content);

      // Gerekli alanların varlığını kontrol et
      if (!parsedContent.question || !parsedContent.options || !parsedContent.correctAnswer || !parsedContent.explanation) {
        throw new Error("Eksik alanlar var");
      }

      // Options kontrolü
      if (!parsedContent.options.a || !parsedContent.options.b || !parsedContent.options.c || !parsedContent.options.d) {
        throw new Error("Eksik şıklar var");
      }

      return NextResponse.json({ text: content });
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError, "Content:", content);
      return new NextResponse(
        JSON.stringify({
          error: "API'den gelen yanıt geçerli bir JSON formatında değil veya gerekli alanlar eksik.",
          details: parseError instanceof Error ? parseError.message : "Unknown parsing error",
          content: content // Debug için içeriği de gönder
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[OPENROUTER_ERROR] Full error:", error);
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
        details: error
      }),
      { status: 500 }
    );
  }
}