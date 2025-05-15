import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questions } = requestSchema.parse(body);
    // poolId'yi number'a çevirirken hata kontrolü ekleyelim
    const poolId = parseInt(params.id, 10);
    if (isNaN(poolId)) {
       return NextResponse.json({ error: "Geçersiz Soru Havuzu ID" }, { status: 400 });
    }

    // Soru havuzunun kullanıcıya ait olup olmadığını kontrol et
    // Super admin tüm soru havuzlarına erişebilir
    let questionPool;
    if (session.user.role === 'SUPERADMIN') {
      questionPool = await prisma.questionPool.findUnique({
        where: {
          id: poolId,
        },
      });
    } else {
      questionPool = await prisma.questionPool.findUnique({
        where: {
          id: poolId,
          userId: session.user.id,
        },
      });
    }

    if (!questionPool) {
      return NextResponse.json({ error: "Soru havuzu bulunamadı veya erişim izniniz yok" }, { status: 403 });
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
    console.log("Saving questions to pool ID:", poolId);
    console.log("Questions to save:", questions);

    const savedQuestions = await prisma.$transaction(
      questions.map((question) => {
        console.log("Creating question:", {
          questionText: question.questionText,
          correctAnswer: question.correctAnswer,
          difficulty: question.difficulty,
          poolId: poolId
        });

        return prisma.poolQuestion.create({
          data: {
            questionText: question.questionText,
            options: question.options, // Prisma'nın JSON olarak işlemesi beklenir
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || "", // Açıklama yoksa boş string kullan
            // Zorluk seviyesini doğrudan kullan (artık İngilizce geliyor)
            difficulty: question.difficulty,
            poolId: poolId, // Alan adı schema ile eşleşecek şekilde düzeltildi (poolId)
          },
        });
      })
    );

    console.log("Successfully saved questions:", savedQuestions.length);
    return NextResponse.json(savedQuestions);
  } catch (error) {
    console.error("Sorular kaydedilirken hata:", error);

    // Hata detaylarını logla
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      // Prisma hatası ise daha detaylı bilgi
      if (error.name === 'PrismaClientKnownRequestError' ||
          error.name === 'PrismaClientValidationError') {
        console.error("Prisma error details:", JSON.stringify(error, null, 2));
      }
    }

    return NextResponse.json(
      {
        error: "Sorular kaydedilirken bir hata oluştu",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
