// Admin kullanıcı oluşturma scripti
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Veritabanı bağlantısı kontrol ediliyor...');
    await prisma.$connect();
    console.log('Veritabanı bağlantısı başarılı.');

    // Superadmin kullanıcı bilgileri
    const superadminEmail = 'superadmin@kentkonut.com.tr';
    const superadminPassword = '0+*stolenchild/-0';
    const superadminName = 'Super Admin';

    // Admin kullanıcı bilgileri (sabit kullanıcı)
    const adminEmail = 'noskay@kentkonut.com.tr';
    const adminPassword = '0renegade*';
    const adminName = 'Kent Konut Admin';

    // Superadmin kullanıcısını kontrol et
    const existingSuperadmin = await prisma.user.findUnique({
      where: { email: superadminEmail }
    });

    // Admin kullanıcısını kontrol et
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    // Superadmin kullanıcısı yoksa oluştur
    if (!existingSuperadmin) {
      console.log(`Superadmin kullanıcısı oluşturuluyor: ${superadminEmail}`);

      // Şifreyi hashle
      const hashedPassword = await bcrypt.hash(superadminPassword, 10);

      // Superadmin kullanıcısını oluştur
      const superadmin = await prisma.user.create({
        data: {
          email: superadminEmail,
          name: superadminName,
          password: hashedPassword,
          role: 'SUPERADMIN',
          emailVerified: new Date() // E-posta doğrulanmış olarak işaretle
        }
      });

      console.log(`Superadmin kullanıcısı oluşturuldu: ${superadmin.email}`);
    } else {
      console.log(`Superadmin kullanıcısı zaten mevcut: ${existingSuperadmin.email}`);

      // Superadmin kullanıcısının rolünü güncelle
      if (existingSuperadmin.role !== 'SUPERADMIN') {
        await prisma.user.update({
          where: { id: existingSuperadmin.id },
          data: {
            role: 'SUPERADMIN',
            emailVerified: existingSuperadmin.emailVerified || new Date() // E-posta doğrulanmamışsa doğrula
          }
        });
        console.log(`Superadmin kullanıcısının rolü güncellendi: ${existingSuperadmin.email}`);
      }
    }

    // Admin kullanıcısı yoksa oluştur
    if (!existingAdmin) {
      console.log(`Admin kullanıcısı oluşturuluyor: ${adminEmail}`);

      // Şifreyi hashle
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Admin kullanıcısını oluştur
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date() // E-posta doğrulanmış olarak işaretle
        }
      });

      console.log(`Admin kullanıcısı oluşturuldu: ${admin.email}`);
    } else {
      console.log(`Admin kullanıcısı zaten mevcut: ${existingAdmin.email}`);

      // Admin kullanıcısının rolünü güncelle
      if (existingAdmin.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            role: 'ADMIN',
            emailVerified: existingAdmin.emailVerified || new Date() // E-posta doğrulanmamışsa doğrula
          }
        });
        console.log(`Admin kullanıcısının rolü güncellendi: ${existingAdmin.email}`);
      }
    }

    console.log('İşlem tamamlandı.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
createAdminUser();
