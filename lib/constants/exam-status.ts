/**
 * Sınav durumu enum değerleri
 * 
 * Bu enum, sınav durumlarını tanımlar ve tüm uygulama genelinde tutarlı bir şekilde kullanılır.
 */
export enum ExamStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
  ARCHIVED = "archived"
}

/**
 * Sınav durumu Türkçe karşılıkları
 */
export const ExamStatusLabels: Record<ExamStatus, string> = {
  [ExamStatus.DRAFT]: "Taslak",
  [ExamStatus.ACTIVE]: "Yayında",
  [ExamStatus.COMPLETED]: "Tamamlandı",
  [ExamStatus.ARCHIVED]: "Arşivlenmiş"
};

/**
 * Sınav durumu renk sınıfları
 */
export const ExamStatusColors: Record<ExamStatus, string> = {
  [ExamStatus.DRAFT]: "outline",
  [ExamStatus.ACTIVE]: "bg-green-500",
  [ExamStatus.COMPLETED]: "bg-blue-500",
  [ExamStatus.ARCHIVED]: "secondary"
};

/**
 * Sınav durumu değerlerini içeren dizi
 */
export const ExamStatusValues = Object.values(ExamStatus);
