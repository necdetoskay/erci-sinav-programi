# Sınav Oluşturma Sihirbazı Geliştirme Planı

## 1. Tamamlanan İşlemler

### Bileşenlere Ayırma
- [x] Ortak tipleri `types.ts` dosyasında tanımlama
- [x] `QuestionReviewDialog.tsx` bileşenini oluşturma
- [x] `ManualQuestionForm.tsx` bileşenini oluşturma
- [x] `AIQuestionGenerator.tsx` bileşenini oluşturma
- [x] `QuestionWizardTabs.tsx` bileşenini oluşturma
- [x] `QuestionPoolTab.tsx` bileşenini oluşturma
- [x] `BulkTextImportTab.tsx` bileşenini oluşturma
- [x] `QuestionSelector.tsx` bileşenini oluşturma
- [x] `Step2Questions.tsx` dosyasını güncelleme ve bileşenleri entegre etme

### Yapay Zeka ile Soru Oluşturma Geliştirmeleri
- [x] Yapay zeka bağlantı testi ekleme
- [x] Yapay zeka model seçimi için dropdown menü ekleme
- [x] Her model için açıklama ve kullanım senaryosu ekleme
- [x] Zorluk seviyesi seçimi ekleme
- [x] Soru sayısı seçimi ekleme
- [x] Soru havuzuna kaydetme seçeneği ekleme
- [x] Oluşturulan soruları inceleme ve onaylama diyaloğu ekleme
- [x] Onaylanan soruları sınava ekleme ve bir sonraki adıma geçiş mekanizması ekleme

### Manuel Soru Ekleme Formu
- [x] Soru metni için metin alanı ekleme
- [x] A, B, C, D şıkları için ayrı metin alanları ekleme
- [x] Doğru cevabı seçmek için radio button grubu ekleme
- [x] Zorluk seviyesi seçimi ekleme
- [x] Açıklama için opsiyonel metin alanı ekleme
- [x] Form doğrulama ve hata mesajları ekleme

## 2. Tamamlanmamış Görevler (Öncelik Sırasına Göre)

### 1. API Entegrasyonu
- [ ] Yapay zeka bağlantı testi için gerçek API çağrısı ekleme
- [ ] Yapay zeka ile soru oluşturma için gerçek API çağrısı ekleme
- [ ] Soru havuzuna kaydetme için API çağrısı ekleme
- [ ] Hata yönetimi ve yeniden deneme mekanizması ekleme

**Tahmini Süre:** 2-3 gün
**Gerekli Adımlar:**
1. API endpoint'lerini oluşturma
2. API çağrıları için gerekli parametreleri belirleme
3. Hata yönetimi ve yeniden deneme mekanizması ekleme
4. API yanıtlarını işleme ve UI'a yansıtma

### 2. Soru Havuzu Entegrasyonu
- [ ] Soru havuzlarını yükleme için gerçek API çağrısı ekleme
- [ ] Soru havuzundan soruları yükleme için gerçek API çağrısı ekleme
- [ ] Soru havuzuna yeni soru ekleme için API çağrısı ekleme
- [ ] Soru havuzu filtreleme ve arama özelliklerini geliştirme

**Tahmini Süre:** 1-2 gün
**Gerekli Adımlar:**
1. Soru havuzu API endpoint'lerini oluşturma
2. Filtreleme ve arama parametrelerini belirleme
3. UI bileşenlerini API yanıtlarına göre güncelleme

### 3. Toplu Metin Girişi İyileştirmeleri
- [ ] Toplu metin girişi için daha gelişmiş bir parser ekleme
- [ ] Farklı formatlarda metin girişi desteği ekleme
- [ ] Hatalı format için kullanıcıya yardımcı ipuçları ekleme
- [ ] Önizleme özelliği ekleme

**Tahmini Süre:** 1 gün
**Gerekli Adımlar:**
1. Farklı metin formatları için parser geliştirme
2. Hata yakalama ve kullanıcıya bildirim mekanizması ekleme
3. Önizleme bileşeni oluşturma

### 4. Performans İyileştirmeleri
- [ ] Büyük veri setleri için sayfalama ekleme
- [ ] Önbelleğe alma mekanizması ekleme
- [ ] Yükleme durumları için iskelet ekranlar ekleme
- [ ] Lazy loading ve code splitting ekleme

**Tahmini Süre:** 1-2 gün
**Gerekli Adımlar:**
1. Sayfalama parametrelerini belirleme
2. Önbelleğe alma stratejisi geliştirme
3. İskelet ekranlar oluşturma
4. Lazy loading ve code splitting için yapılandırma

### 5. Erişilebilirlik İyileştirmeleri
- [ ] Klavye navigasyonu ekleme
- [ ] ARIA etiketleri ekleme
- [ ] Kontrast oranlarını iyileştirme
- [ ] Ekran okuyucu desteği ekleme

**Tahmini Süre:** 1 gün
**Gerekli Adımlar:**
1. Klavye navigasyonu için event handler'lar ekleme
2. ARIA etiketleri ekleme
3. Kontrast oranlarını kontrol etme ve iyileştirme
4. Ekran okuyucu testleri yapma

### 6. Test ve Dokümantasyon
- [ ] Birim testleri ekleme
- [ ] Entegrasyon testleri ekleme
- [ ] Kullanıcı dokümantasyonu oluşturma
- [ ] Geliştirici dokümantasyonu oluşturma

**Tahmini Süre:** 2-3 gün
**Gerekli Adımlar:**
1. Test senaryolarını belirleme
2. Birim testleri yazma
3. Entegrasyon testleri yazma
4. Dokümantasyon oluşturma

## 3. Kontrol Listesi

### API Entegrasyonu
- [ ] Yapay zeka bağlantı testi için gerçek API çağrısı ekleme
- [ ] Yapay zeka ile soru oluşturma için gerçek API çağrısı ekleme
- [ ] Soru havuzuna kaydetme için API çağrısı ekleme
- [ ] Hata yönetimi ve yeniden deneme mekanizması ekleme

### Soru Havuzu Entegrasyonu
- [ ] Soru havuzlarını yükleme için gerçek API çağrısı ekleme
- [ ] Soru havuzundan soruları yükleme için gerçek API çağrısı ekleme
- [ ] Soru havuzuna yeni soru ekleme için API çağrısı ekleme
- [ ] Soru havuzu filtreleme ve arama özelliklerini geliştirme

### Toplu Metin Girişi İyileştirmeleri
- [ ] Toplu metin girişi için daha gelişmiş bir parser ekleme
- [ ] Farklı formatlarda metin girişi desteği ekleme
- [ ] Hatalı format için kullanıcıya yardımcı ipuçları ekleme
- [ ] Önizleme özelliği ekleme

### Performans İyileştirmeleri
- [ ] Büyük veri setleri için sayfalama ekleme
- [ ] Önbelleğe alma mekanizması ekleme
- [ ] Yükleme durumları için iskelet ekranlar ekleme
- [ ] Lazy loading ve code splitting ekleme

### Erişilebilirlik İyileştirmeleri
- [ ] Klavye navigasyonu ekleme
- [ ] ARIA etiketleri ekleme
- [ ] Kontrast oranlarını iyileştirme
- [ ] Ekran okuyucu desteği ekleme

### Test ve Dokümantasyon
- [ ] Birim testleri ekleme
- [ ] Entegrasyon testleri ekleme
- [ ] Kullanıcı dokümantasyonu oluşturma
- [ ] Geliştirici dokümantasyonu oluşturma

## 4. Notlar ve Öneriler

- Yapay zeka ile soru oluşturma özelliği için, API çağrılarının hızlı yanıt vermesi önemlidir. Uzun süren işlemler için arka planda çalışan bir iş kuyruğu sistemi düşünülebilir.
- Soru havuzuna kaydetme özelliği, kullanıcıların oluşturdukları soruları tekrar kullanabilmelerini sağlar. Bu nedenle, soru havuzu yönetimi için ayrı bir sayfa oluşturulması düşünülebilir.
- Toplu metin girişi özelliği, kullanıcıların hızlı bir şekilde çok sayıda soru eklemelerini sağlar. Bu nedenle, farklı formatlarda metin girişi desteği eklenmesi önemlidir.
- Performans iyileştirmeleri, özellikle büyük veri setleri için önemlidir. Sayfalama ve önbelleğe alma mekanizmaları, kullanıcı deneyimini iyileştirecektir.
- Erişilebilirlik iyileştirmeleri, tüm kullanıcıların sihirbazı kolayca kullanabilmelerini sağlar. Bu nedenle, klavye navigasyonu ve ekran okuyucu desteği eklenmesi önemlidir.
- Test ve dokümantasyon, sihirbazın güvenilir ve sürdürülebilir olmasını sağlar. Bu nedenle, birim testleri ve entegrasyon testleri eklenmesi önemlidir.
