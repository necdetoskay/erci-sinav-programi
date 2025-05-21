"use client";

// Soru havuzu tipi
export interface QuestionPool {
  id: number;
  title: string;
  subject: string;
  grade: string;
  difficulty: string;
  questionCount: number;
}

// Soru havuzu sorusu tipi
export interface PoolQuestion {
  id: number;
  questionText: string;
  options: Array<{
    text: string;
    label: string;
  }>;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
}

// AI ile oluşturulan soru tipi
export interface AIGeneratedQuestion {
  id: number;
  text: string;
  options: Array<{
    id: number;
    text: string;
  }>;
  correctAnswer: string;
  explanation?: string;
  position: number;
  approved: boolean;
}

// Manuel oluşturulan soru tipi
export interface ManualQuestion {
  id: number;
  text: string;
  options: Array<{
    id: number;
    text: string;
  }>;
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  position: number;
}

// AI model tipi
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  useCase: string;
  isAvailable: boolean;
}

// Zorluk seviyesi tipi
export type DifficultyLevel = "easy" | "medium" | "hard";

// Soru ekleme fonksiyonu tipi
export type AddQuestionFunction = (question: {
  id: number;
  text: string;
  options: Array<{
    id: number;
    text: string;
  }>;
  correctAnswer: string;
  position: number;
}) => void;
