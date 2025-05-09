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
            role: adminRole
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
          },
        });

        console.log(`${colors.bright}${colors.green}Admin kullanıcısı oluşturuldu:${colors.reset}`);
      }

      // Kullanıcı bilgilerini göster
      console.log(`${colors.bright}${colors.magenta}=== ADMIN KULLANICI BİLGİLERİ ===${colors.reset}`);
      console.log(`${colors.bright}E-posta:${colors.reset} ${adminEmail}`);
      console.log(`${colors.bright}Şifre:${colors.reset} ${password}`);
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
