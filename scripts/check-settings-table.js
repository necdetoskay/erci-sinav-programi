// Setting tablosunun yapısını kontrol etmek için script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettingsTable() {
  try {
    console.log('Veritabanı bağlantısı kontrol ediliyor...');
    await prisma.$connect();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // Setting tablosunun yapısını kontrol et
    console.log('Setting tablosunun yapısı kontrol ediliyor...');
    
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
        TABLE_NAME = 'Setting'
    `;
    
    console.log('Setting tablosunun yapısı:');
    console.table(tableInfo);
    
    // Tablo içeriğini kontrol et
    console.log('Setting tablosunun içeriği kontrol ediliyor...');
    
    // Raw query ile tüm kayıtları al
    const records = await prisma.$queryRaw`
      SELECT * FROM "Setting" LIMIT 10
    `;
    
    console.log('Setting tablosunun içeriği:');
    console.table(records);
    
    console.log('İşlem tamamlandı.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
checkSettingsTable();
