# Sınav Oluşturma Sihirbazı Bileşenleri

Bu belge, sınav oluşturma sihirbazı için gerekli bileşenleri ve veri akışını detaylandırmaktadır.

## Gerekli Yeni Bileşenler

### 1. Sihirbaz Kapsayıcı Bileşenleri

- **WizardContainer**: Tüm sihirbaz adımlarını kapsayan ana bileşen
- **WizardContext**: Sihirbaz verilerini ve durumunu yöneten context
- **WizardProvider**: Context provider bileşeni
- **useWizard**: Sihirbaz verilerine erişim için custom hook

### 2. Navigasyon ve İlerleme Bileşenleri

- **StepIndicator**: Mevcut adımı ve ilerleme durumunu gösteren bileşen
- **NavigationButtons**: İleri/Geri butonlarını içeren bileşen
- **WizardSummary**: Sihirbaz özet bilgilerini gösteren bileşen

### 3. Adım Bileşenleri

- **Step1BasicInfo**: Temel bilgiler adımı
- **Step2Questions**: Soru ekleme adımı
- **Step3Sharing**: Paylaşım ayarları adımı
- **Step4Scheduling**: Zamanlama ve tamamlama adımı

### 4. Yardımcı Bileşenler

- **QuestionSelector**: Soru havuzundan soru seçme bileşeni
- **PersonnelSelector**: Personel seçme bileşeni
- **DateTimePicker**: Tarih ve saat seçme bileşeni
- **AccessCodeGenerator**: Erişim kodu oluşturma/düzenleme bileşeni
- **EmailTemplateEditor**: E-posta şablonu düzenleme bileşeni

## Veri Akışı ve State Yönetimi

### Veri Modeli

```typescript
interface ExamWizardData {
  // Adım 1: Temel Bilgiler
  basicInfo: {
    title: string;
    description: string;
    durationMinutes: number;
    difficulty: string;
    category: string;
  };
  
  // Adım 2: Sorular
  questions: {
    id: number;
    text: string;
    options: Array<{
      id: number;
      text: string;
    }>;
    correctAnswer: string;
    position: number;
  }[];
  
  // Adım 3: Paylaşım
  sharing: {
    personnel: {
      id: string;
      name: string;
      email: string;
    }[];
    accessCode: string;
    isPublic: boolean;
  };
  
  // Adım 4: Zamanlama
  scheduling: {
    startDate: Date | null;
    startImmediately: boolean;
    sendEmails: boolean;
    emailSubject: string;
    emailBody: string;
  };
}
```

### Context API Yapısı

```typescript
interface WizardContextType {
  // Veri
  data: ExamWizardData;
  
  // Durum
  currentStep: number;
  isSubmitting: boolean;
  errors: Record<string, string[]>;
  
  // Metodlar
  setCurrentStep: (step: number) => void;
  updateBasicInfo: (data: Partial<ExamWizardData['basicInfo']>) => void;
  addQuestion: (question: ExamWizardData['questions'][0]) => void;
  removeQuestion: (questionId: number) => void;
  updateQuestion: (questionId: number, data: Partial<ExamWizardData['questions'][0]>) => void;
  reorderQuestions: (questions: ExamWizardData['questions']) => void;
  updateSharing: (data: Partial<ExamWizardData['sharing']>) => void;
  addPersonnel: (personnel: ExamWizardData['sharing']['personnel'][0]) => void;
  removePersonnel: (personnelId: string) => void;
  updateScheduling: (data: Partial<ExamWizardData['scheduling']>) => void;
  validateStep: (step: number) => boolean;
  submitExam: () => Promise<void>;
  resetWizard: () => void;
}
```

### LocalStorage Entegrasyonu

Kullanıcı deneyimini iyileştirmek için, sihirbaz verilerini LocalStorage'da saklayacağız. Bu sayede:

1. Sayfa yenilendiğinde veriler kaybolmaz
2. Kullanıcı daha sonra devam etmek üzere çalışmasını kaydedebilir
3. Tarayıcı çökmesi durumunda veri kaybı önlenir

```typescript
// LocalStorage anahtarı
const WIZARD_STORAGE_KEY = 'exam-wizard-data';

// Verileri kaydet
const saveToLocalStorage = (data: ExamWizardData) => {
  localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(data));
};

// Verileri yükle
const loadFromLocalStorage = (): ExamWizardData | null => {
  const data = localStorage.getItem(WIZARD_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

// Verileri temizle
const clearLocalStorage = () => {
  localStorage.removeItem(WIZARD_STORAGE_KEY);
};
```

## API Entegrasyonu

Sihirbaz, aşağıdaki API endpoint'lerini kullanacaktır:

1. **Sınav Oluşturma**: `/api/admin/exams` (POST)
2. **Soru Ekleme**: `/api/admin/exams/:examId/questions` (POST)
3. **Personel Listesi**: `/api/admin/users?role=PERSONEL` (GET)
4. **E-posta Gönderimi**: `/api/admin/send-exam-invitations` (POST)

## Adımlar Arası Geçiş Mantığı

1. Her adım, kendi içinde doğrulama kurallarına sahip olacak
2. Bir sonraki adıma geçmeden önce mevcut adım doğrulanacak
3. Önceki adımlara her zaman dönülebilecek
4. Son adımda, tüm veriler tekrar doğrulanacak ve sınav oluşturulacak
