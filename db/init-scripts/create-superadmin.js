// Admin kullanıcısı oluşturma/güncelleme script'i
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Renkli konsol çıktısı için
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Rastgele şifre oluşturma fonksiyonu
function generateSecurePassword(length = 12) {
  // Şifre karakterleri: büyük/küçük harfler, rakamlar ve özel karakterler
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let password = '';

  // En az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermeli
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*()-_=+'[Math.floor(Math.random() * 14)];

  // Geri kalan karakterleri rastgele seç
  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  // Karakterleri karıştır
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}Admin kullanıcısı oluşturma/güncelleme işlemi başlatılıyor...${colors.reset}`);

  const prisma = new PrismaClient();
  let retries = 5;

  while (retries > 0) {
    try {
      // Veritabanı bağlantısını test et
      console.log(`${colors.bright}${colors.yellow}Veritabanı bağlantısı test ediliyor... (Kalan deneme: ${retries})${colors.reset}`);
      await prisma.$queryRaw`SELECT 1`;
      console.log(`${colors.bright}${colors.green}Veritabanı bağlantısı başarılı.${colors.reset}`);

      // Admin kullanıcı bilgileri
      const adminEmail = 'admin@kentkonut.com.tr';
      const adminName = 'Admin Kullanıcı';
      const adminRole = 'ADMIN';

      // Her zaman rastgele şifre oluştur
      const password = generateSecurePassword(12); // 12 karakter uzunluğunda güvenli şifre

      // Şifreyi hash'le
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // İkinci admin kullanıcı bilgileri (sabit şifreli)
      const secondAdminEmail = 'noskay@kentkonut.com.tr';
      const secondAdminName = 'Necdet Oskay';
      const secondAdminRole = 'ADMIN';
      const secondAdminPassword = process.env.ADMIN_PASSWORD || '0renegade*';

      // İkinci admin şifresini hash'le
      const secondAdminHashedPassword = await bcrypt.hash(secondAdminPassword, saltRounds);

      // Superadmin kullanıcı bilgileri
      const superadminUsername = 'superadmin';
      const superadminEmail = 'superadmin@kentkonut.com.tr';
      const superadminName = 'Super Admin';
      const superadminRole = 'SUPERADMIN';
      const superadminPassword = process.env.SUPERADMIN_PASSWORD || '0+*stolenchild/-0';

      // Superadmin şifresini hash'le
      const superadminHashedPassword = await bcrypt.hash(superadminPassword, saltRounds);

      // Kullanıcının varlığını kontrol et
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingUser) {
        // Kullanıcı varsa şifresini güncelle
        await prisma.user.update({
          where: { email: adminEmail },
          data: {
            password: hashedPassword,
            role: adminRole,
            emailVerified: existingUser.emailVerified || new Date() // Hesap onayı yoksa ekle
          },
        });

        console.log(`${colors.bright}${colors.yellow}Admin kullanıcısı güncellendi:${colors.reset}`);
      } else {
        // Kullanıcı yoksa oluştur
        await prisma.user.create({
          data: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            role: adminRole,
            emailVerified: new Date(), // Hesap onayını otomatik olarak tamamla
          },
        });

        console.log(`${colors.bright}${colors.green}Admin kullanıcısı oluşturuldu:${colors.reset}`);
      }

      // İkinci admin kullanıcısını kontrol et ve oluştur/güncelle
      const existingSecondAdmin = await prisma.user.findUnique({
        where: { email: secondAdminEmail },
      });

      if (existingSecondAdmin) {
        // Kullanıcı varsa şifresini güncelle
        await prisma.user.update({
          where: { email: secondAdminEmail },
          data: {
            password: secondAdminHashedPassword,
            role: secondAdminRole,
            emailVerified: existingSecondAdmin.emailVerified || new Date() // Hesap onayı yoksa ekle
          },
        });

        console.log(`${colors.bright}${colors.yellow}İkinci admin kullanıcısı güncellendi:${colors.reset}`);
      } else {
        // Kullanıcı yoksa oluştur
        await prisma.user.create({
          data: {
            email: secondAdminEmail,
            name: secondAdminName,
            password: secondAdminHashedPassword,
            role: secondAdminRole,
            emailVerified: new Date(), // Hesap onayını otomatik olarak tamamla
          },
        });

        console.log(`${colors.bright}${colors.green}İkinci admin kullanıcısı oluşturuldu:${colors.reset}`);
      }

      // Superadmin kullanıcısını kontrol et ve oluştur/güncelle
      const existingSuperadmin = await prisma.user.findFirst({
        where: {
          OR: [
            { email: superadminEmail },
            { name: superadminUsername }
          ]
        },
      });

      if (existingSuperadmin) {
        // Kullanıcı varsa şifresini ve rolünü güncelle
        await prisma.user.update({
          where: { id: existingSuperadmin.id },
          data: {
            email: superadminEmail,
            name: superadminName,
            password: superadminHashedPassword,
            role: superadminRole,
            emailVerified: existingSuperadmin.emailVerified || new Date() // Hesap onayı yoksa ekle
          },
        });

        console.log(`${colors.bright}${colors.yellow}Superadmin kullanıcısı güncellendi:${colors.reset}`);
      } else {
        // Kullanıcı yoksa oluştur
        await prisma.user.create({
          data: {
            email: superadminEmail,
            name: superadminUsername, // Kullanıcı adı olarak "superadmin" kullanılıyor
            password: superadminHashedPassword,
            role: superadminRole,
            emailVerified: new Date(), // Hesap onayını otomatik olarak tamamla
          },
        });

        console.log(`${colors.bright}${colors.green}Superadmin kullanıcısı oluşturuldu:${colors.reset}`);
      }

      // Kullanıcı bilgilerini göster
      console.log(`${colors.bright}${colors.magenta}=== ADMIN KULLANICI BİLGİLERİ ===${colors.reset}`);
      console.log(`${colors.bright}E-posta:${colors.reset} ${adminEmail}`);
      console.log(`${colors.bright}Şifre:${colors.reset} ${password}`);
      console.log(`${colors.bright}${colors.magenta}===============================${colors.reset}`);

      console.log(`${colors.bright}${colors.magenta}=== İKİNCİ ADMIN KULLANICI BİLGİLERİ ===${colors.reset}`);
      console.log(`${colors.bright}E-posta:${colors.reset} ${secondAdminEmail}`);
      console.log(`${colors.bright}Şifre:${colors.reset} ${secondAdminPassword}`);
      console.log(`${colors.bright}${colors.magenta}===============================${colors.reset}`);

      console.log(`${colors.bright}${colors.magenta}=== SUPERADMIN KULLANICI BİLGİLERİ ===${colors.reset}`);
      console.log(`${colors.bright}Kullanıcı Adı:${colors.reset} ${superadminUsername}`);
      console.log(`${colors.bright}E-posta:${colors.reset} ${superadminEmail}`);
      console.log(`${colors.bright}Şifre:${colors.reset} ${superadminPassword}`);
      console.log(`${colors.bright}${colors.magenta}===============================${colors.reset}`);

      // İşlem başarılı, döngüden çık
      break;
    } catch (error) {
      retries--;
      console.error(`${colors.bright}${colors.red}Veritabanı hatası:${colors.reset}`, error);

      if (retries > 0) {
        console.log(`${colors.bright}${colors.yellow}5 saniye sonra tekrar denenecek...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error(`${colors.bright}${colors.red}Maksimum deneme sayısına ulaşıldı. İşlem iptal ediliyor.${colors.reset}`);
      }
    }
  }

  // Bağlantıyı kapat
  try {
    await prisma.$disconnect();
  } catch (e) {
    console.error(`${colors.bright}${colors.red}Bağlantı kapatılırken hata:${colors.reset}`, e);
  }
}

// Script'i çalıştır
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
