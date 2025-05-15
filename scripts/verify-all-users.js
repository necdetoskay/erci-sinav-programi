// Tüm kullanıcıların e-posta doğrulama durumunu güncelleyen script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAllUsers() {
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
        emailVerified: true
      }
    });
    
    console.log(`${users.length} kullanıcı bulundu.`);
    
    // Tüm kullanıcıların e-posta doğrulama durumunu güncelle
    console.log('Kullanıcıların e-posta doğrulama durumu güncelleniyor...');
    
    for (const user of users) {
      console.log(`${user.email} kullanıcısının e-posta doğrulama durumu güncelleniyor...`);
      
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          emailVerified: new Date()
        }
      });
      
      console.log(`${user.email} kullanıcısının e-posta doğrulama durumu güncellendi.`);
    }
    
    console.log('Tüm kullanıcıların e-posta doğrulama durumu güncellendi.');
    
    // Güncellenmiş kullanıcıları kontrol et
    console.log('Güncellenmiş kullanıcılar kontrol ediliyor...');
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true
      }
    });
    
    console.log('Güncellenmiş kullanıcı listesi:');
    updatedUsers.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`E-posta: ${user.email}`);
      console.log(`Ad: ${user.name || 'Belirtilmemiş'}`);
      console.log(`E-posta Doğrulanmış: ${user.emailVerified ? 'Evet - ' + user.emailVerified : 'Hayır'}`);
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
verifyAllUsers();
