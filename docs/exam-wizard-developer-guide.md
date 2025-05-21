# Sınav Oluşturma Sihirbazı Geliştirici Dokümantasyonu

Bu belge, Kent Konut Sınav Portalı'ndaki Sınav Oluşturma Sihirbazı'nın teknik yapısını ve geliştirme sürecini açıklamaktadır.

## Mimari Genel Bakış

Sınav Oluşturma Sihirbazı, aşağıdaki bileşenlerden oluşmaktadır:

1. **Sihirbaz Kapsayıcı Bileşenleri**:
   - `WizardContainer`: Tüm sihirbaz adımlarını kapsayan ana bileşen
   - `WizardContext`: Sihirbaz verilerini ve durumunu yöneten context
   - `WizardProvider`: Context provider bileşeni
   - `useWizard`: Sihirbaz verilerine erişim için custom hook

2. **Navigasyon ve İlerleme Bileşenleri**:
   - `StepIndicator`: Mevcut adımı ve ilerleme durumunu gösteren bileşen
   - `NavigationButtons`: İleri/Geri butonlarını içeren bileşen
   - `WizardSummary`: Sihirbaz özet bilgilerini gösteren bileşen

3. **Adım Bileşenleri**:
   - `Step1BasicInfo`: Temel bilgiler adımı
   - `Step2Questions`: Soru ekleme adımı
   - `Step3Sharing`: Paylaşım ayarları adımı
   - `Step4Scheduling`: Zamanlama ve tamamlama adımı

4. **Yardımcı Bileşenler**:
   - `QuestionSelector`: Soru havuzundan soru seçme bileşeni
   - `PersonnelSelector`: Personel seçme bileşeni
   - `QuestionList`: Seçilen soruları gösteren ve sıralama yapan bileşen

## Dosya Yapısı

```
/app
  /admin
    /exams
      /wizard
        /page.tsx (Ana sihirbaz sayfası)
        /components
          /WizardContainer.tsx
          /StepIndicator.tsx
          /NavigationButtons.tsx
          /Step1BasicInfo.tsx
          /Step2Questions.tsx
          /Step3Sharing.tsx
          /Step4Scheduling.tsx
          /QuestionSelector.tsx
          /PersonnelSelector.tsx
          /QuestionList.tsx
          /WizardSummary.tsx
```

## Veri Modeli

Sihirbaz, aşağıdaki veri modelini kullanmaktadır:

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

## Context API

Sihirbaz, React Context API kullanarak veri yönetimini sağlamaktadır. `WizardContext` ve `useWizard` hook'u, sihirbaz verilerine ve metodlarına erişim sağlar.

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

## LocalStorage Entegrasyonu

Sihirbaz, kullanıcı deneyimini iyileştirmek için LocalStorage kullanarak verileri saklar. Bu sayede:

1. Sayfa yenilendiğinde veriler kaybolmaz
2. Kullanıcı daha sonra devam etmek üzere çalışmasını kaydedebilir
3. Tarayıcı çökmesi durumunda veri kaybı önlenir

```typescript
// LocalStorage anahtarı
const WIZARD_STORAGE_KEY = 'exam-wizard-data';

// Verileri kaydet
useEffect(() => {
  localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(data));
}, [data]);

// Verileri yükle
useEffect(() => {
  const savedData = localStorage.getItem(WIZARD_STORAGE_KEY);
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      setData(parsedData);
    } catch (error) {
      console.error("Failed to parse saved wizard data:", error);
    }
  }
}, []);
```

## API Entegrasyonu

Sihirbaz, aşağıdaki API endpoint'lerini kullanmaktadır:

1. **Sınav Oluşturma**: `/api/admin/exams` (POST)
2. **Soru Ekleme**: `/api/admin/exams/:examId/questions` (POST)
3. **Sınav Durumu Güncelleme**: `/api/admin/exams/:examId/status` (PUT)
4. **E-posta Gönderimi**: `/api/admin/send-exam-invitations` (POST)
5. **Soru Havuzları Listesi**: `/api/question-pools` (GET)
6. **Soru Havuzu Soruları**: `/api/question-pools/:poolId/questions` (GET)
7. **Personel Listesi**: `/api/admin/users?role=PERSONEL` (GET)

## Drag and Drop Sıralama

Soru sıralama özelliği, `@dnd-kit` kütüphanesi kullanılarak uygulanmıştır. Bu kütüphane, erişilebilir ve performanslı bir sürükle-bırak deneyimi sağlar.

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    const newQuestions = arrayMove(questions, oldIndex, newIndex).map(
      (q, index) => ({
        ...q,
        position: index + 1,
      })
    );

    onReorder(newQuestions);
  }
};
```

## Form Doğrulama

Sihirbaz, her adımda form doğrulama işlemi gerçekleştirir. Doğrulama kuralları, `validateStep` metodunda tanımlanmıştır.

```typescript
const validateStep = (step: number): boolean => {
  const newErrors: Record<string, string[]> = {};

  switch (step) {
    case 0: // Temel Bilgiler
      if (!data.basicInfo.title.trim()) {
        newErrors.title = ["Sınav adı zorunludur"];
      }
      break;
    case 1: // Sorular
      if (data.questions.length === 0) {
        newErrors.questions = ["En az bir soru eklemelisiniz"];
      }
      break;
    // Diğer adımlar için doğrulama kuralları
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Performans Optimizasyonları

1. **Memoization**: Gereksiz yeniden render'ları önlemek için React.memo ve useMemo kullanılmıştır
2. **Lazy Loading**: Adım bileşenleri, sadece gerektiğinde yüklenir
3. **Debounce**: Arama işlemleri için debounce uygulanmıştır
4. **Virtualization**: Uzun listeler için sanal liste kullanılmıştır

## Gelecek Geliştirmeler

1. **Yeni Soru Oluşturma**: Soru havuzundan seçmenin yanı sıra, yeni soru oluşturma özelliği eklenecek
2. **Yeni Personel Ekleme**: Personel seçmenin yanı sıra, yeni personel ekleme özelliği eklenecek
3. **Sınav Önizleme**: Sınavı oluşturmadan önce önizleme özelliği eklenecek
4. **Sınav Şablonları**: Önceden tanımlanmış şablonlardan sınav oluşturma özelliği eklenecek
5. **Otomatik Kaydetme**: Belirli aralıklarla otomatik kaydetme özelliği eklenecek
