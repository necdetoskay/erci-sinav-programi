// Superadmin şifresini sıfırlama scripti
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetSuperadminPassword() {
  try {
    console.log('Veritabanı bağlantısı kontrol ediliyor...');
    await prisma.$connect();
    console.log('Veritabanı bağlantısı başarılı.');

    // Superadmin kullanıcısını kontrol et
    const superadminEmail = 'superadmin@kentkonut.com.tr';
    const superadmin = await prisma.user.findUnique({
      where: { email: superadminEmail }
    });

    if (!superadmin) {
      console.log(`Superadmin kullanıcısı (${superadminEmail}) bulunamadı.`);
      return;
    }

    // Yeni şifre
    const newPassword = '0+*stolenchild/-0';
    
    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Superadmin şifresini güncelle
    await prisma.user.update({
      where: { id: superadmin.id },
      data: {
        password: hashedPassword,
        emailVerified: new Date() // E-posta doğrulamasını da güncelle
      }
    });

    console.log('Superadmin şifresi başarıyla sıfırlandı.');
    console.log('Yeni şifre:', newPassword);
    console.log('E-posta:', superadminEmail);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
resetSuperadminPassword();
