import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const questionSchema = z.object({
  questionText: z.string(),
  options: z.array(
    z.object({
      text: z.string(),
      label: z.string(),
    })
  ),
  correctAnswer: z.string(),
  explanation: z.string(),
  // Bileşenden gelen İngilizce küçük harf zorluk seviyelerini kabul et
  difficulty: z.enum(["easy", "medium", "hard"]), 
  // ID ve approved alanları isteğe bağlı olarak eklenebilir, ancak Prisma'ya gönderilmeyecek
  id: z.string().optional(),
  approved: z.boolean().optional(),
});

const requestSchema = z.object({
  questions: z.array(questionSchema),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { questions } = requestSchema.parse(body);
    // poolId'yi number'a çevirirken hata kontrolü ekleyelim
    const poolId = parseInt(params.id, 10);
    if (isNaN(poolId)) {
       return NextResponse.json({ error: "Geçersiz Soru Havuzu ID" }, { status: 400 });
    }

    // // Türkçe zorluğu İngilizce'ye çeviren fonksiyon (Artık gerekli değil, çünkü Zod zaten İngilizce bekliyor)
    // const mapDifficultyToEnglish = (difficulty: "Kolay" | "Orta" | "Zor"): "easy" | "medium" | "hard" => {
    //     switch (difficulty) {
    //         case "Kolay": return "easy";
    //         case "Orta": return "medium";
    //         case "Zor": return "hard";
    //         default: return "medium"; // Varsayılan
    //     }
    // };
    // Prisma'ya doğrudan gelen İngilizce değeri gönder

    // Tüm soruları tek bir transaction içinde kaydet
    const savedQuestions = await prisma.$transaction(
      questions.map((question) =>
        prisma.poolQuestion.create({
          data: {
            questionText: question.questionText,
            options: question.options, // Prisma'nın JSON olarak işlemesi beklenir
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            // Zorluk seviyesini doğrudan kullan (artık İngilizce geliyor)
            difficulty: question.difficulty, 
            poolId: poolId, // Alan adı schema ile eşleşecek şekilde düzeltildi (poolId)
          },
        })
      )
    );

    return NextResponse.json(savedQuestions);
  } catch (error) {
    console.error("Sorular kaydedilirken hata:", error);
    return NextResponse.json(
      { error: "Sorular kaydedilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
