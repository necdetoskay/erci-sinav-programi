// Sonuç tipi
export interface ExamResult {
  id: number;
  exam_id: number;
  participant_name: string;
  participant_email: string | null;
  score: number | null;
  total_questions: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  answers: any | null;
}

// Sınav tipi
export interface Exam {
  id: number;
  title: string;
  description: string | null;
  status: string;
  duration_minutes: number;
  access_code: string;
  created_at: string;
}
