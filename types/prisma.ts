// Prisma model tipleri
export enum ExamAttemptStatus {
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  SUBMITTED = 'SUBMITTED',
  TIMED_OUT = 'TIMED_OUT',
  GRADED = 'GRADED'
}

export enum QuestionPoolStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface QuestionPool {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  difficulty: string;
  status: QuestionPoolStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PoolQuestion {
  id: number;
  questionText: string;
  options: any;
  correctAnswer: string;
  explanation: string | null;
  tags: string[];
  difficulty: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  poolId: number;
}

export interface Exam {
  id: number;
  title: string;
  description: string | null;
  status: string;
  duration_minutes: number;
  access_code: string;
  created_at: Date;
  updated_at: Date;
}

export interface ExamAttempt {
  id: string;
  examId: number;
  participantName: string | null;
  participantEmail: string | null;
  status: ExamAttemptStatus;
  currentQuestionIndex: number;
  startTime: Date;
  endTime: Date | null;
  lastActivityAt: Date | null;
  answers: any;
  createdAt: Date;
  attemptAnswers: ExamAttemptAnswer[];
}

export interface ExamAttemptAnswer {
  id: number;
  examAttemptId: string;
  questionId: number;
  answer: string;
  isCorrect: boolean;
  question: {
    correct_answer: string;
    explanation: string | null;
  } | null;
}

export interface Question {
  id: number;
  exam_id: number;
  question_text: string;
  options: any; // JSON structure for options
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  position: number | null;
  created_at: Date;
}
