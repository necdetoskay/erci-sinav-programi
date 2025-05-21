import { z } from "zod";

// Provider ve Model tipleri
export interface Provider {
  id: string;
  name: string;
  apiKey: string;
  models: Model[];
}

export interface Model {
  id: string;
  name: string;
  apiCode?: string;
  details?: string;
  orderIndex: number;
  isEnabled: boolean;
  providerId: string;
  provider?: Provider;
}

// Zod şeması (API'nin beklediği alanlara göre güncellenebilir)
export const formSchema = z.object({
  promptText: z.string().min(10, { message: "Prompt en az 10 karakter olmalıdır." }),
  count: z.coerce.number().min(1, "En az 1 soru üretilmeli").max(25, "En fazla 25 soru üretilebilir"), // API limiti 25
  // optionsPerQuestion: z.coerce.number().min(2).max(6), // API bunu bekliyor, ekleyelim
  model: z.string(), // Artık enum yerine string kullanıyoruz çünkü modeller dinamik olarak yüklenecek
  // difficulty API tarafından doğrudan kullanılmıyor, prompt'a eklenebilir
  difficulty: z.enum(["easy", "medium", "hard"])
});

export type FormData = z.infer<typeof formSchema>;

// Üretilen soru tipi (API yanıtına göre ayarlanmalı)
export type GeneratedQuestion = {
  id: string; // UUID ile atanacak
  questionText: string;
  options: Array<{
    text: string;
    label: string; // A, B, C...
  }>;
  correctAnswer: string; // A, B, C...
  explanation: string;
  difficulty: "easy" | "medium" | "hard"; // Formdan gelen zorluk
  approved?: boolean;
};
