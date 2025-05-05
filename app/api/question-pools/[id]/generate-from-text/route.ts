import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db"; // Soruları kaydetmek için db'ye ihtiyaç olacak

// Ön yüzden gelen model isimleriyle eşleşen enum (generate-questions.tsx ile aynı)
const modelEnum = z.enum([
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-4-scout:free",
  "qwen/qwen3-235b-a22b:free",
  "deepseek-ai/deepseek-coder-33b-instruct",
  "google/gemini-pro"
]);

const requestSchema = z.object({
  prompt: z.string().min(10, { message: "Prompt en az 10 karakter olmalıdır." }), // contextText yerine prompt
  numQuestions: z.number().min(1),
  difficulty: z.enum(["Kolay", "Orta", "Zor"]), // Zorluk string enum olarak alındı
  model: modelEnum,
});

// mapDifficulty fonksiyonu kaldırıldı

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const poolId = parseInt(params.id, 10);
    if (isNaN(poolId)) {
      return NextResponse.json({ error: "Geçersiz Soru Havuzu ID" }, { status: 400 });
    }

    // Soru havuzunun varlığını kontrol et (isteğe bağlı ama iyi pratik)
    const questionPool = await db.questionPool.findUnique({
      where: { id: poolId },
    });

    if (!questionPool) {
      return NextResponse.json({ error: "Soru Havuzu bulunamadı" }, { status: 404 });
    }


    const body = await request.json();
    // Değişken isimleri güncellendi
    const { prompt: userPrompt, numQuestions, difficulty, model } = requestSchema.parse(body);

    // difficulty zaten string ("Kolay", "Orta", "Zor")

    // API'ye gönderilecek prompt güncellendi
    const apiPrompt = [
      `Sen bir eğitim uzmanısın. Aşağıdaki prompt'u kullanarak ${numQuestions} adet ${difficulty} zorluk seviyesinde sınav sorusu oluştur.`, // difficulty doğrudan kullanıldı
      "Sorular prompt ile doğrudan ilgili olmalı.",
      "",
      "Kullanıcı Prompt'u:",
      "---",
      userPrompt, // contextText yerine userPrompt kullanıldı
      "---",
      "",
      "Her soru için aşağıdaki gereksinimleri karşılamalısın:",
      "- Soru metni açık ve anlaşılır olmalı ve prompt'tan türetilmeli.",
      "- Her soru için tam olarak 4 şık olmalı (A, B, C, D). Şıklar da prompt ile ilgili olmalı.",
      "- Doğru cevap belirtilmeli (A, B, C veya D).",
      "- Kısa ve öz bir çözüm açıklaması olmalı.",
      `- Tüm soruların zorluk seviyesi "${difficulty}" olmalı.`, // difficulty doğrudan kullanıldı
      "",
      "Yanıtını aşağıdaki JSON formatında ver (markdown kod bloğu kullanmadan, sadece JSON):",
      JSON.stringify({
        questions: [
          {
            questionText: "soru metni burada (metinden türetilmiş)",
            options: [
              { label: "A", text: "birinci şık (metinle ilgili)" },
              { label: "B", text: "ikinci şık (metinle ilgili)" },
              { label: "C", text: "üçüncü şık (metinle ilgili)" },
              { label: "D", text: "dördüncü şık (metinle ilgili)" }
            ],
            correctAnswer: "A", // Metinde cevabı olan şık
            explanation: "çözüm açıklaması burada",
            difficulty: difficulty // "Kolay", "Orta" veya "Zor"
          }
        ]
      }, null, 2),
      "",
      "Önemli: Yanıtını kesinlikle markdown kod bloğu (```) kullanmadan, doğrudan JSON formatında ver."
    ].join("\n");

    // OpenRouter API isteği
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": `${process.env.SITE_URL}` || "http://localhost:3000",
        "X-Title": "Erci Sinav Programi - Text", // Başlığı ayırt edici yapalım
      },
      body: JSON.stringify({
        model: model, // Ön yüzden gelen model adı doğrudan kullanılıyor
        messages: [
          {
            role: "user",
            content: apiPrompt, // Güncellenmiş prompt kullanıldı
          },
        ],
        // Gerekirse temperature, max_tokens gibi parametreler eklenebilir
      }),
    });

    // console.log(`OpenRouter API Response Status: ${response.status} ${response.statusText}`); // Removed log

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenRouter API Error Response:", errorBody);
      // Kota hatasını kontrol et
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson?.error?.message?.includes("Quota exceeded")) {
          // Özel kota hatası mesajı döndür
          return NextResponse.json(
            { error: "quota_exceeded", message: `Seçilen model (${model}) için kullanım kotası aşıldı. Lütfen farklı bir model deneyin veya daha sonra tekrar deneyin.` },
            { status: 429 } // Too Many Requests
          );
        }
      } catch (e) {
        // JSON parse edilemezse veya beklenen yapıda değilse, genel hatayı fırlat
        console.warn("Could not parse OpenRouter error response as JSON:", errorBody);
      }
      // Genel API hatası fırlat
      throw new Error(`OpenRouter API yanıtı başarısız: ${response.status} ${response.statusText}. Detay: ${errorBody}`);
    }

    const data = await response.json();
    let generatedQuestions;

    // Model yanıtını işleme (içteki try...catch kaldırıldı)
    // Check for expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error("Unexpected OpenRouter API response structure:", data);
        // Throw a structured error that the frontend can parse
        throw new Error(JSON.stringify({
            error: "unexpected_api_structure",
            message: "Yapay zeka modelinden gelen yanıt işlenemedi (beklenmedik yapı)." // Daha spesifik mesaj
        }));
    }

    const content = data.choices[0].message.content;
    // console.log("Raw OpenRouter Response Content:", content); // Removed log

    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    // console.log("Cleaned Content for Parsing:", cleanContent); // Removed log

    try {
      const parsedContent = JSON.parse(cleanContent);

      if (!parsedContent || !Array.isArray(parsedContent.questions)) {
          console.error("Parsed content does not contain 'questions' array:", parsedContent);
          // Throw a structured error for missing questions array
          throw new Error(JSON.stringify({
              error: "missing_questions_array",
              message: "Model yanıtı 'questions' dizisini içermiyor."
          }));
      }

      // Gelen soruları doğrula ve formatla (zorluk seviyesini ekle)
      // id: uuidv4() eklendi, ön yüzde unique key için lazım olacak
      generatedQuestions = parsedContent.questions.map((q: any) => ({
        id: uuidv4(), // Ön yüzde unique key için geçici ID
        questionText: q.questionText || "",
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map((opt: any) => ({ // En fazla 4 şık al
          label: opt.label || "",
          text: opt.text || ""
        })) : [],
        correctAnswer: q.correctAnswer || "",
        explanation: q.explanation || "",
        difficulty: difficulty, // Gelen zorluk seviyesini ata ("Kolay", "Orta", "Zor")
        // questionPoolId burada atanmayacak, batch save sırasında eklenecek
      }));

      // Veritabanına kaydetme işlemi kaldırıldı. Sorular doğrudan döndürülecek.

    } catch (parseError: any) {
      console.error("JSON parse hatası:", parseError.message);
      console.error("Temizlenmiş içerik:", cleanContent);
      // Throw a structured error for JSON parsing issues
       throw new Error(JSON.stringify({
           error: "json_parse_error",
           message: `Model yanıtı işlenirken bir JSON format hatası oluştu.`
       }));
    }

    // Başarılı yanıt olarak üretilen soruları döndür
    return NextResponse.json(generatedQuestions);

  } catch (error: any) {
    console.error("Genel Hata Yakalandı:", error);

    // 1. Zod Hataları
    if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
        return NextResponse.json(
            { error: "validation_error", message: `Geçersiz istek verisi: ${errorMessage}` },
            { status: 400 }
        );
    }

    // 2. Yapılandırılmış Hatalarımız (JSON string olarak fırlatıldı)
    if (error instanceof Error && error.message.startsWith('{')) {
        try {
            const structuredError = JSON.parse(error.message);
            // Yapılandırılmış hatayı uygun status kodu ile döndür
            let status = 500; // Default internal server error
            if (structuredError.error === "quota_exceeded") status = 429;
            if (structuredError.error === "unexpected_api_structure") status = 502; // Treat as Bad Gateway from upstream
            if (structuredError.error === "json_parse_error") status = 500;
            if (structuredError.error === "missing_questions_array") status = 500;

            // API'den gelen mesajı önceliklendir
            const message = structuredError.message || "İşlem sırasında bir hata oluştu.";
            return NextResponse.json({ error: structuredError.error || "unknown_processing_error", message }, { status });
        } catch (e) {
            // JSON parse edilemezse, aşağıdan devam et (ham mesaj olarak işlenecek)
            console.warn("Could not parse structured error message in final catch:", error.message);
        }
    }

    // 3. OpenRouter API Hataları (Eğer JSON olarak fırlatılmadıysa)
     if (error instanceof Error && error.message.startsWith("OpenRouter API yanıtı başarısız")) {
         // Wrap it in our standard structure
         return NextResponse.json(
             { error: "api_error", message: error.message },
             { status: 502 } // Bad Gateway
         );
     }

    // 4. Diğer tüm bilinmeyen hatalar
    const unknownErrorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return NextResponse.json(
      { error: "unknown_error", message: `Sorular üretilirken beklenmedik bir hata oluştu: ${unknownErrorMessage}` },
      { status: 500 }
    );
  }
}
