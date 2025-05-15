// Bu script, veritabanına test amaçlı PERSONEL rolüne sahip kullanıcılar ekler
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('PERSONEL rolüne sahip kullanıcılar ekleniyor...');

    // Örnek personel verileri
    const personnel = [
      { name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@kentkonut.com.tr' },
      { name: 'Ayşe Demir', email: 'ayse.demir@kentkonut.com.tr' },
      { name: 'Mehmet Kaya', email: 'mehmet.kaya@kentkonut.com.tr' },
      { name: 'Fatma Şahin', email: 'fatma.sahin@kentkonut.com.tr' },
      { name: 'Ali Öztürk', email: 'ali.ozturk@kentkonut.com.tr' },
      { name: 'Zeynep Çelik', email: 'zeynep.celik@kentkonut.com.tr' },
      { name: 'Mustafa Aydın', email: 'mustafa.aydin@kentkonut.com.tr' },
      { name: 'Elif Yıldız', email: 'elif.yildiz@kentkonut.com.tr' },
      { name: 'Hüseyin Şen', email: 'huseyin.sen@kentkonut.com.tr' },
      { name: 'Hatice Koç', email: 'hatice.koc@kentkonut.com.tr' },
      { name: 'İbrahim Arslan', email: 'ibrahim.arslan@kentkonut.com.tr' },
      { name: 'Sevgi Güneş', email: 'sevgi.gunes@kentkonut.com.tr' },
      { name: 'Osman Korkmaz', email: 'osman.korkmaz@kentkonut.com.tr' },
      { name: 'Gül Doğan', email: 'gul.dogan@kentkonut.com.tr' },
      { name: 'Kemal Yalçın', email: 'kemal.yalcin@kentkonut.com.tr' },
    ];

    // Varsayılan şifre
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Her bir personel için
    for (const person of personnel) {
      // Kullanıcının zaten var olup olmadığını kontrol et
      const existingUser = await prisma.user.findUnique({
        where: { email: person.email }
      });

      if (existingUser) {
        console.log(`${person.email} zaten mevcut, güncelleniyor...`);
        await prisma.user.update({
          where: { email: person.email },
          data: { 
            role: 'PERSONEL',
            name: person.name
          }
        });
      } else {
        console.log(`${person.email} ekleniyor...`);
        await prisma.user.create({
          data: {
            name: person.name,
            email: person.email,
            password: hashedPassword,
            role: 'PERSONEL',
            emailVerified: new Date()
          }
        });
      }
    }

    console.log('İşlem tamamlandı!');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
