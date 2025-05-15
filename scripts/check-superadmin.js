// Superadmin kullanıcısını kontrol etmek için script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSuperadmin() {
  try {
    console.log('Veritabanı bağlantısı kontrol ediliyor...');
    await prisma.$connect();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // Superadmin kullanıcısını kontrol et
    console.log('Superadmin kullanıcısı kontrol ediliyor...');
    const superadmin = await prisma.user.findUnique({
      where: { email: 'superadmin@kentkonut.com.tr' }
    });
    
    if (superadmin) {
      console.log('Superadmin kullanıcısı bulundu:');
      console.log(`ID: ${superadmin.id}`);
      console.log(`E-posta: ${superadmin.email}`);
      console.log(`Ad: ${superadmin.name || 'Belirtilmemiş'}`);
      console.log(`Rol: ${superadmin.role}`);
      console.log(`E-posta Doğrulanmış: ${superadmin.emailVerified ? 'Evet' : 'Hayır'}`);
      console.log(`Oluşturulma Tarihi: ${superadmin.createdAt}`);
    } else {
      console.log('Superadmin kullanıcısı bulunamadı.');
    }
    
    console.log('İşlem tamamlandı.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
checkSuperadmin();
