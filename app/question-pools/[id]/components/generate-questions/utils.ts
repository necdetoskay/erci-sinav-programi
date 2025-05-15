import { v4 as uuidv4 } from "uuid";
import { GeneratedQuestion } from "./types";

// Helper function to shuffle an array (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// API'den gelen metni parse etme fonksiyonu (Revize Edilmiş)
export const parseGeneratedText = (text: string, count: number, difficulty: "easy" | "medium" | "hard"): GeneratedQuestion[] => {
  const questions: GeneratedQuestion[] = [];
  const lines = text.trim().split('\n');
  let currentQuestion: Partial<GeneratedQuestion> = {};
  let options: Array<{ text: string; label: string }> = [];
  let questionCounter = 0;
  let potentialQuestionLines: string[] = []; // Soru metni olabilecek satırları biriktir

  const optionRegex = /^\s*([A-D])\)\s*(.*)/; // Sadece A, B, C, D şıklarını kabul et
  const answerRegex = /^\s*Doğru Cevap:\s*([A-D])/i; // Sadece A, B, C, D cevaplarını kabul et, ** işaretlerini kaldırdık
  const explanationRegex = /^\s*Açıklama:\s*(.*)/i; // ** işaretlerini kaldırdık
  const numberedQuestionRegex = /^\s*\d+[\.\)]\s*(.*)/; // Hem nokta hem parantez

  const finalizeCurrentQuestion = () => {
    if (currentQuestion.questionText || potentialQuestionLines.length > 0) {
      // Birikmiş potansiyel satırları soru metni olarak ata (eğer soru metni zaten yoksa)
      if (!currentQuestion.questionText && potentialQuestionLines.length > 0) {
        currentQuestion.questionText = potentialQuestionLines.join('\n').trim();
      }
      // Eksik alanları doldur
      currentQuestion.options = options;
      currentQuestion.difficulty = difficulty;
      currentQuestion.id = uuidv4();
      // Sadece geçerli görünen soruları ekle (en azından soru metni ve seçenekleri olmalı)
      if (currentQuestion.questionText && currentQuestion.options && currentQuestion.options.length > 0) {
         questions.push(currentQuestion as GeneratedQuestion);
      } else {
          console.warn("Skipping incomplete question:", currentQuestion);
      }
      // Sıfırla
      currentQuestion = {};
      options = [];
      potentialQuestionLines = [];
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue; // Boş satırları atla

    const numberedMatch = trimmedLine.match(numberedQuestionRegex);
    const optionMatch = trimmedLine.match(optionRegex);
    const answerMatch = trimmedLine.match(answerRegex);
    const explanationMatch = trimmedLine.match(explanationRegex);

    // Yeni bir numaralı soru başlangıcı
    if (numberedMatch && questionCounter < count) {
      finalizeCurrentQuestion(); // Önceki soruyu bitir
      questionCounter++;
      currentQuestion = { questionText: numberedMatch[1].trim() };
    }
    // Seçenek
    else if (optionMatch) {
      // Eğer potansiyel soru satırları varsa ve henüz soru metni atanmamışsa, şimdi ata
      if (potentialQuestionLines.length > 0 && !currentQuestion.questionText) {
        currentQuestion.questionText = potentialQuestionLines.join('\n').trim();
        potentialQuestionLines = []; // Birikmişleri temizle
      }
      // Seçeneği ekle (eğer bir soru bağlamındaysak)
      if (currentQuestion.questionText || questions.length > 0 || options.length > 0) { // Daha esnek kontrol
           options.push({ label: optionMatch[1], text: optionMatch[2].trim() });
      } else {
           console.warn("Option found outside of a question context:", trimmedLine);
      }
    }
    // Doğru Cevap
    else if (answerMatch) {
      if (currentQuestion.questionText) { // Sadece bir soru içindeysek ata
        currentQuestion.correctAnswer = answerMatch[1].toUpperCase();
      }
    }
    // Açıklama
    else if (explanationMatch) {
       if (currentQuestion.questionText) { // Sadece bir soru içindeysek ata
          currentQuestion.explanation = explanationMatch[1].trim();
       }
    }
    // Diğer durumlar: Potansiyel soru metni veya devamı
    else {
      // Eğer henüz bir soru metni yoksa veya seçenekler başlamadıysa, potansiyel soru satırı olarak ekle
      if (!currentQuestion.questionText || options.length === 0) {
        potentialQuestionLines.push(trimmedLine);
      }
      // Eğer seçenekler başladıysa ve bu satır bir cevap/açıklama değilse, önceki seçeneğin devamı olabilir (şimdilik loglayalım)
      else if (options.length > 0 && !answerMatch && !explanationMatch) {
         console.warn("Line possibly belongs to previous option or unexpected format:", trimmedLine);
         // İsteğe bağlı: Son seçeneğe ekleme logiği eklenebilir
         // if (options.length > 0) {
         //   options[options.length - 1].text += '\n' + trimmedLine;
         // }
      }
    }
  }

  // Döngü bittikten sonra son soruyu tamamla
  finalizeCurrentQuestion();

  // Eğer istenen sayıda soru parse edilemediyse uyarı ver
  if (questions.length !== count) {
    console.warn(`Expected ${count} questions, but parsed ${questions.length}. API response format might be inconsistent.`);
    console.log("Raw API response:", text); // Ham API yanıtını logla
    // toast.warning(`API ${count} soru üretmedi (${questions.length} üretildi). Yanıt formatı tutarsız olabilir.`); // Kullanıcıyı çok fazla uyarmamak için kaldırılabilir
  }

  return questions;
};

// Function to shuffle options within a single question
export const shuffleQuestionOptions = (question: GeneratedQuestion): GeneratedQuestion => {
    if (!question || !Array.isArray(question.options) || question.options.length === 0) {
        console.warn("Cannot shuffle options for invalid question:", question);
        return question; // Return original if invalid
    }

    // Find the text of the originally correct option
    const correctOption = question.options.find(opt => opt.label === question.correctAnswer);
    if (!correctOption) {
        console.warn("Could not find correct option text for question:", question);
        return question; // Return original if correct option not found
    }
    const correctOptionText = correctOption.text;

    // Shuffle the options array (create a copy to avoid modifying original temporarily)
    const shuffledOptions = shuffleArray([...question.options]);

    // Re-assign labels (A, B, C...) and find the new correct label
    let newCorrectAnswerLabel = '';
    const finalOptions = shuffledOptions.map((option, index) => {
        const newLabel = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
        if (option.text === correctOptionText) {
            newCorrectAnswerLabel = newLabel;
        }
        return { ...option, label: newLabel };
    });

    // Return the question with shuffled options and updated correct answer label
    return {
        ...question,
        options: finalOptions,
        correctAnswer: newCorrectAnswerLabel || question.correctAnswer // Fallback to original if something went wrong
    };
};
