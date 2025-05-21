# Sınav Oluşturma Sihirbazı (Wizard) Uygulama Planı

Bu belge, adım adım ilerleyen bir sınav oluşturma sihirbazının tasarımını ve uygulanmasını planlamak için oluşturulmuştur. Sihirbaz, kullanıcıların kolayca sınav oluşturmasını sağlayacak ve süreç boyunca rehberlik edecektir.

## Genel Bakış

Sınav oluşturma sihirbazı, aşağıdaki adımlardan oluşacaktır:

1. **Temel Bilgiler**: Sınav adı, açıklaması, süresi ve diğer temel bilgiler
2. **Soru Ekleme**: Soru havuzundan soru seçme veya yeni soru oluşturma
3. **Paylaşım Ayarları**: Sınava katılacak personel seçimi ve erişim ayarları
4. **Zamanlama ve Tamamlama**: Sınav başlatma tarihi ve e-posta bildirimleri

## Görev Listesi

### 1. Proje Hazırlığı ve Planlama

- [x] Mevcut sınav oluşturma API'lerini inceleme
- [x] Mevcut kullanıcı arayüzü bileşenlerini inceleme
- [x] Gerekli yeni bileşenleri belirleme
- [x] Veri akışı ve state yönetimi stratejisini belirleme

### 2. Temel Bileşenlerin Oluşturulması

- [x] Sihirbaz kapsayıcı bileşeni (WizardContainer)
- [x] Adım göstergesi bileşeni (StepIndicator)
- [x] İleri/Geri navigasyon butonları
- [x] Form veri yönetimi için context veya custom hook

### 3. Adım 1: Temel Bilgiler Ekranı

- [x] Sınav adı input alanı
- [x] Sınav açıklaması textarea alanı
- [x] Sınav süresi seçici (dakika cinsinden)
- [x] Zorluk seviyesi seçici (dropdown)
- [x] Kategori seçici (dropdown)
- [x] Form doğrulama kuralları
- [x] İleri butonu ve doğrulama kontrolü

### 4. Adım 2: Soru Ekleme Ekranı

- [x] Soru havuzu entegrasyonu
- [x] Soru arama ve filtreleme
- [x] Soru önizleme
- [x] Soru seçme ve ekleme mekanizması
- [x] Seçilen soruların listesi
- [x] Soru sıralama özelliği (drag and drop)
- [x] Yeni soru oluşturma modal/form
- [x] Soru silme ve düzenleme seçenekleri

### 5. Adım 3: Paylaşım Ayarları Ekranı

- [x] Personel listesi entegrasyonu
- [x] Personel arama ve filtreleme
- [x] Personel seçme mekanizması (çoklu seçim)
- [x] Seçilen personellerin listesi
- [x] Yeni personel ekleme modal/form
- [x] Erişim kodu ayarları (otomatik/manuel)
- [x] Sınav görünürlük ayarları (herkese açık/sadece davetliler)

### 6. Adım 4: Zamanlama ve Tamamlama Ekranı

- [x] Takvim bileşeni entegrasyonu
- [x] Tarih ve saat seçici
- [x] "Hemen Başlat" seçeneği
- [x] E-posta bildirimi ayarları
- [x] Sınav özeti görüntüleme
- [x] Tamamla butonu ve final API çağrısı

### 7. API Entegrasyonu

- [x] Sınav oluşturma API endpoint'i
- [x] Soru ekleme API endpoint'i
- [x] Personel seçme API endpoint'i
- [x] E-posta gönderimi API endpoint'i
- [x] Hata yönetimi ve kullanıcı bildirimleri

### 8. Kullanıcı Deneyimi İyileştirmeleri

- [x] Adımlar arası geçişlerde animasyonlar
- [x] Yükleme durumları için skeleton ekranlar
- [x] Hata mesajları ve doğrulama geri bildirimleri
- [x] İpuçları ve yardım metinleri
- [x] Responsive tasarım (mobil uyumluluk)

### 9. Test ve Hata Ayıklama

- [x] Birim testleri
- [x] Entegrasyon testleri
- [x] Kullanıcı arayüzü testleri
- [x] Farklı tarayıcılarda test
- [x] Hata senaryolarının test edilmesi

### 10. Dokümantasyon ve Dağıtım

- [x] Kullanıcı kılavuzu
- [x] Geliştirici dokümantasyonu
- [x] Kod gözden geçirme
- [x] Performans optimizasyonu
- [x] Dağıtım ve canlıya alma

## Teknik Yaklaşım

### Bileşen Yapısı

```
/app
  /admin
    /exams
      /wizard
        /page.tsx (Ana sihirbaz sayfası)
        /step1.tsx (Temel Bilgiler)
        /step2.tsx (Soru Ekleme)
        /step3.tsx (Paylaşım Ayarları)
        /step4.tsx (Zamanlama ve Tamamlama)
        /components
          /WizardContainer.tsx
          /StepIndicator.tsx
          /NavigationButtons.tsx
          /QuestionSelector.tsx
          /PersonnelSelector.tsx
          /DateTimePicker.tsx
```

### Veri Yönetimi

```typescript
// Sihirbaz veri modeli
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
  };
}
```

## Zaman Çizelgesi

- **Proje Hazırlığı ve Planlama**: 1-2 gün
- **Temel Bileşenlerin Oluşturulması**: 2-3 gün
- **Adım 1-4 Ekranlarının Geliştirilmesi**: Her biri için 2-3 gün (toplam 8-12 gün)
- **API Entegrasyonu**: 3-4 gün
- **Kullanıcı Deneyimi İyileştirmeleri**: 2-3 gün
- **Test ve Hata Ayıklama**: 3-4 gün
- **Dokümantasyon ve Dağıtım**: 1-2 gün

**Toplam Süre**: Yaklaşık 20-30 iş günü
