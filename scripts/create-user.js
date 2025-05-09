const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash('Bi41*42*', 10);

    // Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: {
        name: 'Necdet Oskay',
        email: 'noskay@kentkonut.com.tr',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('Kullanıcı başarıyla oluşturuldu:', user);
  } catch (error) {
    console.error('Kullanıcı oluşturulurken hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
