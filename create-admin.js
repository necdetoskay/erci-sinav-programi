// Admin kullanıcısı oluşturma script'i
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Admin kullanıcısı oluşturma işlemi başlatılıyor...');
    
    // Admin şifresi (varsayılan veya çevre değişkeninden)
    const adminPassword = process.env.ADMIN_PASSWORD || 'Bi41*42*';
    
    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Admin kullanıcısını bul veya oluştur
    const admin = await prisma.user.upsert({
      where: { email: 'admin@kentkonut.com.tr' },
      update: {
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
      create: {
        email: 'admin@kentkonut.com.tr',
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log('=== ADMIN KULLANICI BİLGİLERİ ===');
    console.log('E-posta: admin@kentkonut.com.tr');
    console.log(`Şifre: ${adminPassword}`);
    console.log('===============================');
    
    console.log('Admin kullanıcısı başarıyla oluşturuldu/güncellendi.');
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
