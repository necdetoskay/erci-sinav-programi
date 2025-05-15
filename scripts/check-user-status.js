// Kullanıcı durumunu kontrol etmek için script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserStatus() {
  try {
    console.log('Veritabanı bağlantısı kontrol ediliyor...');
    await prisma.$connect();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // Tüm kullanıcıları getir
    console.log('Kullanıcılar getiriliyor...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('Kullanıcı listesi:');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`E-posta: ${user.email}`);
      console.log(`Ad: ${user.name || 'Belirtilmemiş'}`);
      console.log(`E-posta Doğrulanmış: ${user.emailVerified ? 'Evet - ' + user.emailVerified : 'Hayır'}`);
      console.log(`Rol: ${user.role}`);
      console.log(`Oluşturulma Tarihi: ${user.createdAt}`);
      console.log('------------------------');
    });
    
    // Doğrulama tokenlarını kontrol et
    console.log('Doğrulama tokenları kontrol ediliyor...');
    const tokens = await prisma.verificationToken.findMany();
    
    console.log('Doğrulama token listesi:');
    tokens.forEach(token => {
      console.log(`Identifier: ${token.identifier}`);
      console.log(`Token: ${token.token}`);
      console.log(`Expires: ${token.expires}`);
      console.log('------------------------');
    });
    
    // Kullanıcı ayarlarını kontrol et
    console.log('Kullanıcı ayarları kontrol ediliyor...');
    const settings = await prisma.setting.findMany();
    
    console.log('Ayar listesi:');
    settings.forEach(setting => {
      console.log(`ID: ${setting.id}`);
      console.log(`Key: ${setting.key}`);
      console.log(`Value: ${setting.value}`);
      console.log(`User ID: ${setting.userId}`);
      console.log('------------------------');
    });
    
    console.log('İşlem tamamlandı.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
checkUserStatus();
