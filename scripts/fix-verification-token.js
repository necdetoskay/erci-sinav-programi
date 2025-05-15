// VerificationToken tablosunu düzeltmek için script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixVerificationToken() {
  try {
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
    
    // Tablo içeriğini kontrol et
    console.log('VerificationToken tablosunun içeriği kontrol ediliyor...');
    
    // Raw query ile tüm kayıtları al
    const records = await prisma.$queryRaw`
      SELECT * FROM "VerificationToken" LIMIT 10
    `;
    
    console.log('VerificationToken tablosunun içeriği:');
    console.table(records);
    
    // Tablo primary key ve unique constraint'lerini kontrol et
    console.log('VerificationToken tablosunun constraint\'leri kontrol ediliyor...');
    
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name
      FROM 
        information_schema.table_constraints tc
      JOIN 
        information_schema.key_column_usage kcu
      ON 
        tc.constraint_name = kcu.constraint_name
      WHERE 
        tc.table_name = 'VerificationToken'
    `;
    
    console.log('VerificationToken tablosunun constraint\'leri:');
    console.table(constraints);
    
    console.log('İşlem tamamlandı.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
fixVerificationToken();
