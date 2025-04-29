-- Sınavlar tablosu
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft' veya 'published'
  duration_minutes INTEGER DEFAULT 60, -- Sınav süresi (dk)
  access_code VARCHAR(20) -- Personel girişi için opsiyonel kod
);

-- Sorular tablosu
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Seçenekler JSON dizisi olarak
  correct_answer VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D' gibi
  explanation TEXT,
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  position INTEGER, -- Soru sırası
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sınav sonuçları
CREATE TABLE IF NOT EXISTS exam_results (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  participant_email VARCHAR(255),
  score INTEGER,
  total_questions INTEGER,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  answers JSONB, -- Verilen cevaplar JSON olarak
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Örnek trigger fonksiyonu: exam tablosundaki updated_at alanını güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger'ını exams tablosuna bağlama
CREATE TRIGGER update_exams_updated_at 
BEFORE UPDATE ON exams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 