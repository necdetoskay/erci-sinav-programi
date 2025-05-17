describe('Exam Creation', () => {
  beforeEach(() => {
    // Admin olarak giriş yap
    cy.loginAsAdmin();
  });

  it('should create a new exam', () => {
    // Sınav oluşturma sayfasına git
    cy.visit('/admin/exams');
    cy.contains('Yeni Sınav').click();
    
    // Sınav bilgilerini doldur
    const examTitle = `Test Sınavı ${Date.now()}`;
    cy.get('input[name="title"]').type(examTitle);
    cy.get('textarea[name="description"]').type('Bu bir test sınavıdır.');
    cy.get('input[name="duration_minutes"]').clear().type('30');
    
    // Sınavı kaydet
    cy.get('button[type="submit"]').click();
    
    // Sınav listesine yönlendirilmeli ve yeni sınav görünmeli
    cy.url().should('include', '/admin/exams');
    cy.contains(examTitle).should('be.visible');
  });

  it('should add questions to an exam', () => {
    // Önce bir sınav oluştur
    const examTitle = `Soru Ekleme Testi ${Date.now()}`;
    cy.createExam(examTitle, 'Sorular eklenecek test sınavı', 45);
    
    // Oluşturulan sınavı bul ve sorular sayfasına git
    cy.contains(examTitle).parent().parent().find('button').contains('Sorular').click();
    
    // Soru ekle
    cy.contains('Soru Ekle').click();
    
    // Soru bilgilerini doldur
    cy.get('select[name="type"]').select('MULTIPLE_CHOICE');
    cy.get('textarea[name="question_text"]').type('Bu bir test sorusudur?');
    
    // Seçenekleri ekle
    cy.get('input[name="options.0.text"]').type('Seçenek A');
    cy.get('input[name="options.1.text"]').type('Seçenek B');
    cy.get('input[name="options.2.text"]').type('Seçenek C');
    cy.get('input[name="options.3.text"]').type('Seçenek D');
    
    // Doğru cevabı işaretle
    cy.get('input[name="options.1.isCorrect"]').check();
    
    // Soruyu kaydet
    cy.get('button[type="submit"]').click();
    
    // Soru listesinde yeni soru görünmeli
    cy.contains('Bu bir test sorusudur?').should('be.visible');
  });

  it('should publish an exam', () => {
    // Önce bir sınav oluştur
    const examTitle = `Yayınlama Testi ${Date.now()}`;
    cy.createExam(examTitle, 'Yayınlanacak test sınavı', 60);
    
    // Oluşturulan sınavı bul ve düzenle
    cy.contains(examTitle).parent().parent().find('button').contains('Düzenle').click();
    
    // Durumu "published" olarak değiştir
    cy.get('select[name="status"]').select('published');
    
    // Sınavı kaydet
    cy.get('button[type="submit"]').click();
    
    // Sınav listesinde sınav "Yayında" durumunda görünmeli
    cy.contains(examTitle).parent().parent().contains('Yayında').should('be.visible');
  });

  it('should validate exam form fields', () => {
    // Sınav oluşturma sayfasına git
    cy.visit('/admin/exams/create');
    
    // Boş form gönder
    cy.get('button[type="submit"]').click();
    
    // Validasyon hataları görünmeli
    cy.contains('Sınav başlığı gereklidir').should('be.visible');
    cy.contains('Süre gereklidir').should('be.visible');
    
    // Geçersiz süre gir
    cy.get('input[name="title"]').type('Geçersiz Süre Testi');
    cy.get('input[name="duration_minutes"]').clear().type('0');
    cy.get('button[type="submit"]').click();
    
    // Süre validasyon hatası görünmeli
    cy.contains('Süre en az 1 dakika olmalıdır').should('be.visible');
  });
});
