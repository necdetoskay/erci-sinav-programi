// VerificationToken tablosunun yapısını kontrol etmek için script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVerificationTokenTable() {
  try {
    // Veritabanı bağlantısını kontrol et
    console.log('Veritabanı bağlantısı kontrol ediliyor...');
    await prisma.$connect();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // VerificationToken tablosunun yapısını kontrol et
    console.log('VerificationToken tablosunun yapısı kontrol ediliyor...');
    
    // Tablo yapısını almak için raw query kullan
    const tableInfo = await prisma.$queryRaw`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM 
        INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_NAME = 'VerificationToken'
    `;
    
    console.log('VerificationToken tablosunun yapısı:');
    console.table(tableInfo);
    
    // Örnek bir kayıt oluşturmayı dene
    console.log('Örnek bir kayıt oluşturuluyor...');
    
    // Önce mevcut kayıtları temizle
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: 'test@example.com'
      }
    });
    
    // Yeni bir kayıt oluştur
    const token = await prisma.verificationToken.create({
      data: {
        identifier: 'test@example.com',
        token: 'test-token-' + Math.random().toString(36).substring(2, 15),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    });
    
    console.log('Oluşturulan kayıt:', token);
    console.log('Test başarılı!');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
checkVerificationTokenTable();
