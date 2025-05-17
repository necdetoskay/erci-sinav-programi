describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should display login form', () => {
    cy.get('h1').should('contain', 'Giriş Yap');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Toast mesajı veya hata mesajı görünmeli
    cy.contains('E-posta veya şifre hatalı').should('be.visible');
  });

  it('should redirect to dashboard after successful login', () => {
    // Not: Bu test gerçek bir kullanıcı gerektirir, test ortamında mock yapılabilir
    // Burada test kullanıcısı bilgilerini kullanıyoruz
    cy.get('input[name="email"]').type('admin@kentkonut.com.tr');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Başarılı girişten sonra dashboard'a yönlendirilmeli
    cy.url().should('include', '/dashboard');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    
    // Boş alan hata mesajları görünmeli
    cy.contains('E-posta gereklidir').should('be.visible');
    cy.contains('Şifre gereklidir').should('be.visible');
  });

  it('should show validation error for invalid email format', () => {
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    
    // Geçersiz e-posta formatı hatası görünmeli
    cy.contains('Geçerli bir e-posta adresi giriniz').should('be.visible');
  });

  it('should navigate to forgot password page', () => {
    cy.contains('Şifremi Unuttum').click();
    
    // Şifre sıfırlama sayfasına yönlendirilmeli
    cy.url().should('include', '/auth/forgot-password');
  });

  it('should remember email when "Remember me" is checked', () => {
    const testEmail = 'test@kentkonut.com.tr';
    
    // "Beni hatırla" seçeneğini işaretle ve giriş yap
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="remember"]').check();
    cy.get('button[type="submit"]').click();
    
    // Çıkış yap
    cy.contains('Çıkış').click();
    
    // Tekrar giriş sayfasına git
    cy.visit('/auth/login');
    
    // E-posta alanı önceki değeri hatırlamalı
    cy.get('input[name="email"]').should('have.value', testEmail);
  });
});
