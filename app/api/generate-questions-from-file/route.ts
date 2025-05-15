import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { generateQuestions, DifficultyLevel, ModelType } from '@/lib/ai-service'; // Import specific function
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { Readable } from 'stream';

// Helper function to convert a ReadableStream to Buffer
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  try {
    // JWT token'ını al (access-token çerezinden)
    const tokenCookie = req.cookies.get('access-token')?.value;
    if (!tokenCookie) {
      return NextResponse.json({ message: 'Yetkisiz erişim. Lütfen tekrar giriş yapın.' }, { status: 401 });
    }

    // Token'ı doğrula
    const decoded = verify(tokenCookie, process.env.JWT_SECRET || 'default-secret') as {
      id: string;
      email: string;
      role: string;
    };

    if (!decoded || !decoded.id) {
      return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const userId = decoded.id;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const poolIdString = formData.get('poolId') as string | null;
    const poolTitle = formData.get('poolTitle') as string | null; // Optional

    if (!file) {
      return NextResponse.json({ message: 'Dosya bulunamadı.' }, { status: 400 });
    }
    if (!poolIdString) {
      return NextResponse.json({ message: 'Havuz ID bulunamadı.' }, { status: 400 });
    }

    const poolId = parseInt(poolIdString, 10);
    if (isNaN(poolId)) {
      return NextResponse.json({ message: 'Geçersiz Havuz ID.' }, { status: 400 });
    }

    // Check if the user owns the question pool or is an admin (optional, based on your app logic)
    const questionPool = await prisma.questionPool.findUnique({
      where: { id: poolId },
    });

    if (!questionPool) {
      return NextResponse.json({ message: 'Soru havuzu bulunamadı.' }, { status: 404 });
    }
    // Add authorization check if needed:
    // if (questionPool.userId !== userId && token.role !== 'ADMIN') {
    //   return NextResponse.json({ message: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
    // }

    let textContent = '';
    const fileBuffer = await streamToBuffer(file.stream());

    if (file.type === 'text/plain') {
      textContent = fileBuffer.toString('utf-8');
    } else if (file.type === 'application/pdf') {
      try {
        // PDF dosyasını işle
        const data = await pdf(fileBuffer);

        // PDF'ten çıkarılan metni temizle ve düzenle
        // Özel karakterleri ve HTML/XML etiketlerini temizle
        textContent = data.text || '';
        textContent = textContent.replace(/<[^>]*>/g, ''); // HTML/XML etiketlerini temizle
        textContent = textContent.replace(/[^\w\s.,?!;:()\-"']/g, ' '); // Özel karakterleri temizle
        textContent = textContent.replace(/\s+/g, ' ').trim(); // Fazla boşlukları temizle

        console.log('PDF içeriği çıkarıldı:', textContent.substring(0, 100) + '...');

        if (!textContent || textContent.trim() === '') {
          return NextResponse.json({ message: 'PDF dosyası boş veya metin içeriği çıkarılamadı.' }, { status: 400 });
        }
      } catch (pdfError) {
        console.error('PDF işleme hatası:', pdfError);
        return NextResponse.json({ message: `PDF işleme hatası: ${pdfError.message}` }, { status: 500 });
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      textContent = result.value;
    } else {
      return NextResponse.json({ message: 'Desteklenmeyen dosya türü. Lütfen .txt, .pdf veya .docx yükleyin.' }, { status: 400 });
    }

    if (!textContent.trim()) {
      return NextResponse.json({ message: 'Dosya içeriği boş veya okunamadı.' }, { status: 400 });
    }

    // Get AI parameters from formData
    const numberOfQuestionsString = formData.get('numberOfQuestions') as string | null;
    const difficultyFromRequest = formData.get('difficulty') as string | null;
    const modelFromRequest = formData.get('model') as string | null;

    const numberOfQuestions = numberOfQuestionsString ? parseInt(numberOfQuestionsString, 10) : 5; // Default to 5
    const difficulty: DifficultyLevel = (difficultyFromRequest === 'easy' || difficultyFromRequest === 'medium' || difficultyFromRequest === 'hard') ? difficultyFromRequest : 'medium'; // Default to medium
    const model: ModelType = modelFromRequest || 'anthropic/claude-3-sonnet:beta'; // Default model

    const rawGeneratedText = await generateQuestions({
      content: textContent,
      difficulty,
      numberOfQuestions,
      model,
    });

    if (!rawGeneratedText) {
      return NextResponse.json({ message: 'Yapay zeka soru üretemedi (boş yanıt).' }, { status: 500 });
    }

    // --- Parser for the AI output ---
    // Expected format per question from generateQuestions:
    // 1. Soru metni?
    // A) Seçenek A
    // B) Seçenek B
    // C) Seçenek C
    // D) Seçenek D
    // Doğru Cevap: B
    // Açıklama: B'nin doğru cevap olmasının kısa açıklaması.
    const parsedQuestions: Array<{
      id: string; // Added for consistency with GeneratedQuestion type used in frontend
      questionText: string;
      options: Array<{ label: string; text: string }>; // Changed to array of objects
      correctAnswer: string;
      explanation?: string;
      difficulty: string;
      tags: string[];
    }> = [];

    const questionBlocks = rawGeneratedText.trim().split(/\n\s*\n/); // Split by blank lines

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 6) continue; // Basic validation for enough lines for a full question

      const questionTextMatch = lines[0].match(/^\d+[\.\)]\s*(.*)/); // Allow . or ) after number
      const questionText = questionTextMatch ? questionTextMatch[1].trim() : '';
      if (!questionText) continue;

      const options: Record<string, string> = {};
      let lineIndex = 1;
      for (; lineIndex < lines.length; lineIndex++) {
        const optionMatch = lines[lineIndex].match(/^\s*([A-D])\)\s*(.*)/); // Allow leading spaces for options
        if (optionMatch) {
          options[optionMatch[1]] = optionMatch[2].trim();
        } else {
          break;
        }
      }
      if (Object.keys(options).length === 0) continue;


      const correctAnswerMatch = lines[lineIndex]?.match(/^\s*Doğru Cevap:\s*([A-D])/i); // Case insensitive
      const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1].toUpperCase() : ''; // Standardize to uppercase
      if (!correctAnswer) continue;
      lineIndex++;

      const explanationMatch = lines[lineIndex]?.match(/^\s*Açıklama:\s*(.*)/i); // Case insensitive
      const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;

      // Ensure options are in the format expected by GeneratedQuestion type for consistency with shuffleQuestionOptions
      const formattedOptions = Object.entries(options).map(([key, value]) => ({ label: key, text: value }));


      parsedQuestions.push({
        id: Math.random().toString(36).substring(2, 15), // Temporary ID, will be replaced by DB ID
        questionText,
        options: formattedOptions,
        correctAnswer,
        explanation,
        difficulty: difficulty,
        tags: [],
      });
    }

    if (parsedQuestions.length === 0 && numberOfQuestions > 0) {
        // If AI returned text but parser found nothing, it's a parsing issue or bad AI format
        return NextResponse.json({ message: 'Yapay zeka yanıtı işlenemedi veya geçerli soru formatında değil.' }, { status: 500 });
    }


    // The frontend expects the questions in the response to be already saved to DB
    // So, we save them here and return the saved questions.
    const createdDbQuestions = [];
    for (const q of parsedQuestions) {
        const newQuestion = await prisma.poolQuestion.create({
            data: {
                questionText: q.questionText,
                options: q.options.reduce((obj: Record<string, string>, item: { label: string; text: string }) => {
                    obj[item.label] = item.text;
                    return obj;
                }, {}), // Prisma expects Json, which can be Record<string, string>
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                difficulty: q.difficulty,
                tags: q.tags,
                poolId: poolId,
                // createdById: userId,
            },
        });
        createdDbQuestions.push(newQuestion);
    }

    return NextResponse.json({
      message: `${createdDbQuestions.length} soru başarıyla üretildi ve "${poolTitle || questionPool.title}" havuzuna eklendi.`,
      questions: createdDbQuestions, // Return the questions with database IDs
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error generating questions from file:', error);
    // Check for specific error types if needed
    if (error.message.includes('Unsupported DEFLATE')) {
        return NextResponse.json({ message: 'PDF dosyası işlenirken bir hata oluştu. Farklı bir PDF veya format deneyin.' }, { status: 400 });
    }
    return NextResponse.json({ message: `Sunucu hatası: ${error.message}` }, { status: 500 });
  }
}
