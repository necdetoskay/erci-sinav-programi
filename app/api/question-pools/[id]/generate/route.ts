import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";

const requestSchema = z.object({
  count: z.number().min(1).max(25),
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
    const { count, model, difficulty } = requestSchema.parse(body);

    // Soru havuzunu veritabanından al
    const questionPool = await db.questionPool.findUnique({
      where: {
        id: parseInt(params.id)
      }
    });

    if (!questionPool) {
      return NextResponse.json(
        { error: "Soru havuzu bulunamadı" },
        { status: 404 }
      );
    }

    const difficultyInTurkish = {
      easy: "kolay",
      medium: "orta",
      hard: "zor"
    }[difficulty];

    const prompt = [
      `Sen bir eğitim uzmanısın. "${questionPool.title}" konusu hakkında ${count} adet ${difficultyInTurkish} zorluk seviyesinde sınav sorusu oluşturman gerekiyor.`,
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

    if (!response.ok) {
      throw new Error("API yanıtı başarısız");
    }

    const data = await response.json();
    let questions;

    try {
      const content = data.choices[0].message.content;
      
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      try {
        const parsedContent = JSON.parse(cleanContent);
        questions = parsedContent.questions;

        questions = questions.map((q: any) => ({
          ...q,
          id: uuidv4(),
        }));
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError);
        console.error("Temizlenmiş içerik:", cleanContent);
        throw new Error("API yanıtı geçerli bir JSON formatında değil");
      }
    } catch (error) {
      console.error("API yanıtı işlenirken hata:", error);
      throw new Error("API yanıtı işlenirken hata oluştu");
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Genel hata:", error);
    return NextResponse.json(
      { error: "Sorular üretilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 