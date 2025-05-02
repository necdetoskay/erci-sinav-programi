import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
// import { db } from "@/lib/db"; // db importu kaldırıldı, artık pool title'a gerek yok

const requestSchema = z.object({
  count: z.number().min(1).max(25),
  promptText: z.string().min(10, { message: "Prompt en az 10 karakter olmalıdır." }), // promptText eklendi
  model: z.enum([
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "meta-llama/llama-4-scout:free",
    "qwen/qwen3-235b-a22b:free",
    "deepseek-ai/deepseek-coder-33b-instruct",
    "google/gemini-pro"
  ]),
  difficulty: z.enum(["easy", "medium", "hard"])
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    // promptText destructure edildi, questionPool sorgusu kaldırıldı
    const { count, promptText, model, difficulty } = requestSchema.parse(body);

    // Soru havuzu kontrolü kaldırıldı, artık gerekli değil.
    // ID hala başka amaçlar için kullanılabilir (örn. loglama), bu yüzden parametre kalabilir.

    const difficultyInTurkish = {
      easy: "kolay",
      medium: "orta",
      hard: "zor"
    }[difficulty];

    const prompt = [
      // questionPool.title yerine promptText kullanıldı
      `Sen bir eğitim uzmanısın. "${promptText}" konusu hakkında ${count} adet ${difficultyInTurkish} zorluk seviyesinde sınav sorusu oluşturman gerekiyor.`,
      "Her soru için aşağıdaki gereksinimleri karşılamalısın:",
      "- Soru metni açık ve anlaşılır olmalı",
      "- Her soru için tam olarak 4 şık olmalı (A, B, C, D)",
      "- Doğru cevap belirtilmeli (A, B, C veya D)",
      "- Çözüm açıklaması olmalı",
      `- Tüm soruların zorluk seviyesi "${difficulty}" olmalı`,
      "",
      "Yanıtını aşağıdaki JSON formatında ver (markdown kod bloğu kullanmadan, sadece JSON):",
      JSON.stringify({
        questions: [
          {
            questionText: "soru metni burada",
            options: [
              { label: "A", text: "birinci şık" },
              { label: "B", text: "ikinci şık" },
              { label: "C", text: "üçüncü şık" },
              { label: "D", text: "dördüncü şık" }
            ],
            correctAnswer: "A",
            explanation: "çözüm açıklaması burada",
            difficulty: "easy"
          }
        ]
      }, null, 2),
      "",
      "Önemli: Yanıtını kesinlikle markdown kod bloğu (```) kullanmadan, doğrudan JSON formatında ver."
    ].join("\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": `${process.env.SITE_URL}` || "http://localhost:3000",
        "X-Title": "Erci Sinav Programi",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    // Log status and status text for debugging
    console.log(`OpenRouter API Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // Log the response body if the request failed
      const errorBody = await response.text();
      console.error("OpenRouter API Error Response:", errorBody);
      throw new Error(`API yanıtı başarısız: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let questions;

    try {
      // Check if choices exist and have content
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          console.error("Unexpected OpenRouter API response structure:", data);
          throw new Error("API yanıtı beklenen yapıda değil");
      }
      
      const content = data.choices[0].message.content;
      console.log("Raw OpenRouter Response Content:", content); // Log raw content

      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      console.log("Cleaned Content for Parsing:", cleanContent); // Log cleaned content

      try {
        const parsedContent = JSON.parse(cleanContent);
        
        // Add validation for parsedContent structure if needed
        if (!parsedContent || !Array.isArray(parsedContent.questions)) {
            console.error("Parsed content does not contain 'questions' array:", parsedContent);
            throw new Error("API yanıtı 'questions' dizisini içermiyor");
        }

        questions = parsedContent.questions;

        questions = questions.map((q: any) => ({
          ...q,
          id: uuidv4(),
        }));
      } catch (parseError: any) { // Catch specific error type
        console.error("JSON parse hatası:", parseError.message);
        console.error("Temizlenmiş içerik:", cleanContent); // Log content that failed parsing
        // Provide a more specific error message
        throw new Error(`API yanıtı geçerli bir JSON formatında değil. Hata: ${parseError.message}`);
      }
    } catch (error: any) { // Catch specific error type
      console.error("API yanıtı işlenirken hata:", error.message);
      // Propagate the specific error message if available
      throw new Error(`API yanıtı işlenirken hata oluştu: ${error.message}`);
    }

    return NextResponse.json(questions);
  } catch (error: any) { // Catch specific error type
    console.error("Genel hata:", error); // Log the full error object
    // Return a more informative error message if possible
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
    return NextResponse.json(
      { error: `Sorular üretilirken bir hata oluştu: ${errorMessage}` },
      { status: 500 }
    );
  }
}
